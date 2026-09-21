import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearLastSelectedChecklist,
  readLastSelectedChecklist,
  writeLastSelectedChecklist,
} from './lastChecklistStore';

describe('마지막으로 고른 체크리스트', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('고른 적이 없으면 제공 템플릿으로 시작한다', () => {
    expect(readLastSelectedChecklist()).toBe('SYSTEM_DEFAULT');
  });

  it('고른 목록을 기억한다', () => {
    writeLastSelectedChecklist(7);
    expect(readLastSelectedChecklist()).toBe(7);
  });

  it('제공 템플릿을 고르면 그대로 기억한다', () => {
    writeLastSelectedChecklist(7);
    writeLastSelectedChecklist('SYSTEM_DEFAULT');
    expect(readLastSelectedChecklist()).toBe('SYSTEM_DEFAULT');
  });

  it('기억을 지우면 제공 템플릿으로 돌아간다', () => {
    writeLastSelectedChecklist(7);
    clearLastSelectedChecklist();
    expect(readLastSelectedChecklist()).toBe('SYSTEM_DEFAULT');
  });

  it('망가진 값이 남아 있어도 제공 템플릿으로 시작한다', () => {
    window.localStorage.setItem('jachwi-sunbae:last-checklist', 'nope');
    expect(readLastSelectedChecklist()).toBe('SYSTEM_DEFAULT');
    window.localStorage.setItem('jachwi-sunbae:last-checklist', '-3');
    expect(readLastSelectedChecklist()).toBe('SYSTEM_DEFAULT');
  });
});
