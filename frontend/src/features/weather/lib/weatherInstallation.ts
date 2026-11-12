const STORAGE_KEY = 'jachwi-weather-installation-v1';
type WeatherInstallation = { installationId: string; installationSecret: string };
const INSTALLATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INSTALLATION_SECRET_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

/** origin별 설치 소유 증명만 저장한다. FCM 토큰은 저장하지 않는다. 회원 탈퇴 때도 유지한다. */
export const getWeatherInstallation = (): WeatherInstallation => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      // 저장소 값은 타입을 믿을 수 없으므로 unknown으로 받아 필드마다 확인한다.
      const value: unknown = JSON.parse(stored);
      if (
        typeof value !== 'object' ||
        value === null ||
        !('installationId' in value) ||
        typeof value.installationId !== 'string' ||
        !INSTALLATION_ID_PATTERN.test(value.installationId) ||
        !('installationSecret' in value) ||
        typeof value.installationSecret !== 'string' ||
        !INSTALLATION_SECRET_PATTERN.test(value.installationSecret)
      )
        throw new Error();
      return { installationId: value.installationId, installationSecret: value.installationSecret };
    }
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const installation = {
      installationId: crypto.randomUUID(),
      installationSecret: btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installation));
    return installation;
  } catch {
    // 저장이 실패했을 때 임시 ID로 등록하면 다음 실행에서 소유 증명을 잃는다.
    throw new Error('기기 등록 정보를 안전하게 보관하지 못했습니다.');
  }
};
