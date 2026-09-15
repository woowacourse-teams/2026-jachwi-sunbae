import { describe, expect, it } from 'vitest';
import { parseMaintenanceContent, propertyMemoDisplayLabel, serializeMaintenanceContent } from './propertyOptions';

describe('관리비 부가 정보', () => {
  it('이전 관리비 문구와 공과금 명칭을 현재 편집 형식으로 바꾼다', () => {
    expect(propertyMemoDisplayLabel('관리비 및 공과금')).toBe('관리비 포함 공과금');
    expect(parseMaintenanceContent('10만원 (수도, 인터넷)')).toEqual({
      total: '10만원',
      selected: ['수도세', '인터넷'],
    });
  });

  it('총 관리비와 포함 공과금을 읽기 쉬운 한 문장으로 저장한다', () => {
    expect(serializeMaintenanceContent(' 12만원 ', ['인터넷', '수도세'])).toBe('12만원 (수도세, 인터넷)');
    expect(serializeMaintenanceContent('', ['가스비'])).toBe('가스비');
  });
});
