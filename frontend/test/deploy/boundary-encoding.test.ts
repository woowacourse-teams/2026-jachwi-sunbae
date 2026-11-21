// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

type ViewerRequest = { uri: string; headers: Record<string, { value: string }> };
type Handler = (event: { request: ViewerRequest }) => ViewerRequest;

// CloudFront Function은 모듈이 아니라 `handler`를 전역에 두는 스크립트라, 파일을 읽어 함수로 감싸 꺼낸다.
const source = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../deploy/cloudfront/boundary-encoding.js'),
  'utf8',
);
const loaded: unknown = new Function(`${source}; return handler;`)();
if (typeof loaded !== 'function') throw new Error('handler를 찾지 못했다.');
const handler: Handler = (event) => loaded(event);

const BOUNDARY = '/boundaries/admin-dongs.31.20250630.2102d383dd9d.geojson';
const rewrite = (uri: string, acceptEncoding?: string) =>
  handler({
    request: { uri, headers: acceptEncoding === undefined ? {} : { 'accept-encoding': { value: acceptEncoding } } },
  }).uri;

it('brotli를 받는 브라우저의 시도별 경계 요청만 .br 객체로 돌린다', () => {
  expect(rewrite(BOUNDARY, 'gzip, deflate, br, zstd')).toBe(`${BOUNDARY}.br`);
  expect(rewrite(BOUNDARY, 'BR')).toBe(`${BOUNDARY}.br`);
  expect(rewrite(BOUNDARY, 'gzip;q=1.0, br;q=0.8')).toBe(`${BOUNDARY}.br`);
});

it('brotli를 받지 못하거나 거절한 요청은 gzip 객체를 그대로 받는다', () => {
  expect(rewrite(BOUNDARY)).toBe(BOUNDARY);
  expect(rewrite(BOUNDARY, 'gzip, deflate')).toBe(BOUNDARY);
  expect(rewrite(BOUNDARY, 'gzip, br;q=0')).toBe(BOUNDARY);
  expect(rewrite(BOUNDARY, 'brotli-like, gzip')).toBe(BOUNDARY);
});

it('brotli 객체를 올리지 않는 파일과 다른 경로는 건드리지 않는다', () => {
  for (const uri of [
    '/boundaries/manifest.json',
    '/boundaries/admin-dongs.20250630.ae67e0b8885e.geojson',
    '/boundaries/legal-sig.1404e3e21271.geojson',
    `${BOUNDARY}.br`,
    '/main.286f6df9c67c1b8da292.js',
    '/neighborhoods',
  ])
    expect(rewrite(uri, 'gzip, br')).toBe(uri);
});
