import { beforeEach, describe, expect, it } from 'vitest';

import { getWeatherInstallation } from '@/features/weather/lib/weatherInstallation';

const STORAGE_KEY = 'jachwi-weather-installation-v1';
const installation = {
  installationId: '3f2b8c1e-6d4a-4e9b-9c0d-1a2b3c4d5e6f',
  installationSecret: 'A'.repeat(43),
};

describe('getWeatherInstallation', () => {
  beforeEach(() => localStorage.clear());

  it('저장된 값이 없으면 새로 만들어 저장한다', () => {
    const created = getWeatherInstallation();

    expect(created.installationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.installationSecret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(created);
    expect(getWeatherInstallation()).toEqual(created);
  });

  it('저장된 값의 형식이 맞으면 알고 있는 필드만 돌려준다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...installation, extra: 'ignored' }));

    expect(getWeatherInstallation()).toEqual(installation);
  });

  it.each([
    ['null', 'null'],
    ['문자열', '"installation"'],
    ['배열', '[]'],
    ['빈 객체', '{}'],
    ['숫자 ID', JSON.stringify({ ...installation, installationId: 1 })],
    ['UUID v4가 아닌 ID', JSON.stringify({ ...installation, installationId: 'not-a-uuid' })],
    ['빠진 secret', JSON.stringify({ installationId: installation.installationId })],
    ['짧은 secret', JSON.stringify({ ...installation, installationSecret: 'short' })],
    ['객체 secret', JSON.stringify({ ...installation, installationSecret: { value: 'A'.repeat(43) } })],
  ])('저장된 값이 %s이면 믿지 않고 오류를 던지며 덮어쓰지 않는다', (_label, stored) => {
    localStorage.setItem(STORAGE_KEY, stored);

    expect(getWeatherInstallation).toThrow('기기 등록 정보');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(stored);
  });
});
