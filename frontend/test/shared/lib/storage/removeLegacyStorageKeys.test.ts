import { afterEach, expect, it, vi } from 'vitest';

import { removeLegacyStorageKeys } from '@/shared/lib/storage/removeLegacyStorageKeys';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

it('예전 브라우저에 남은 키만 지우고 지금 쓰는 키는 둔다', () => {
  window.localStorage.setItem('jachwi-sunbae:example-property:https%3A%2F%2Fapi.test:1', 'dismissed');
  window.localStorage.setItem('jachwi-sunbae:last-checklist', '3');
  window.localStorage.setItem('jachwi-sunbae:example-property:https%3A%2F%2Fapi.test:2', 'dismissed');
  window.localStorage.setItem('jachwi-recent-property-edit', '{}');

  removeLegacyStorageKeys();

  expect(Object.keys(window.localStorage).sort()).toEqual([
    'jachwi-recent-property-edit',
    'jachwi-sunbae:last-checklist',
  ]);
});

it('끝난 이벤트의 미션 완료 기록을 지운다', () => {
  window.localStorage.setItem('jachwi:event-mission', '{"street-memo":1700000000000}');
  window.localStorage.setItem('jachwi-sunbae:last-checklist', '3');

  removeLegacyStorageKeys();

  expect(window.localStorage.getItem('jachwi:event-mission')).toBeNull();
  expect(window.localStorage.getItem('jachwi-sunbae:last-checklist')).toBe('3');
});

it('저장소를 읽지 못해도 앱 시작을 막지 않는다', () => {
  const blocked = {
    get length(): number {
      throw new DOMException('막힘', 'SecurityError');
    },
  } as Storage;

  expect(() => removeLegacyStorageKeys(blocked)).not.toThrow();
});
