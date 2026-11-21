// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');

it('index.html은 빌드 때 정해진 API 서버와 연결을 미리 맺는다', () => {
  // 첫 API 요청인 자동 로그인이 쿠키를 싣는 요청이라 crossorigin을 붙이지 않는다. 붙이면 쓰지 않는 연결이 하나 더 열린다.
  expect(html).toContain('<link rel="preconnect" href="<%= htmlWebpackPlugin.options.apiOrigin %>" />');
  expect(html.match(/rel="preconnect"/g)).toHaveLength(1);
});
