import { afterEach, expect, it } from 'vitest';

import { drawsMapOnEntry } from '@/app/router/mapEntryPaths';

afterEach(() => sessionStorage.clear());

it('홈은 데스크탑이면 늘, 휴대폰이면 리스트 보기가 아닐 때 지도를 그린다', () => {
  expect(drawsMapOnEntry('/', '', true)).toBe(true);
  expect(drawsMapOnEntry('/', '?view=list', true)).toBe(true);
  expect(drawsMapOnEntry('/', '', false)).toBe(true);
  expect(drawsMapOnEntry('/', '?view=map', false)).toBe(true);
  expect(drawsMapOnEntry('/', '?view=list', false)).toBe(false);
});

it('휴대폰 홈은 주소에 보기 방식이 없으면 마지막으로 고른 보기를 따른다', () => {
  sessionStorage.setItem('jachwi:records-view', 'list');
  expect(drawsMapOnEntry('/', '', false)).toBe(false);
  expect(drawsMapOnEntry('/', '?view=map', false)).toBe(true);
});

it('동네 찾기는 회원 주소와 공개 주소, 동네 상세 주소 모두 지도를 그린다', () => {
  for (const pathname of [
    '/neighborhoods',
    '/neighborhoods/',
    '/explore',
    '/neighborhoods/areas/11230640',
    '/explore/areas/11230640/details',
  ])
    expect(drawsMapOnEntry(pathname, '', false)).toBe(true);
});

it('지도가 없거나 나중에 붙는 화면은 미리 받지 않는다', () => {
  for (const pathname of [
    '/landing',
    '/guide',
    '/privacy',
    '/me',
    '/checklists',
    '/properties/1',
    '/neighborhoods/nearby',
    '/explore/nearby',
    '/compare',
  ])
    expect(drawsMapOnEntry(pathname, '', true)).toBe(false);
});
