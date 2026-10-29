const STORAGE_KEY = 'jachwi-analytics-test-traffic';
const UT_SESSION_STORAGE_KEY = 'jachwi-analytics-ut-session';
// 참가자 번호(UT01-P01 등)만 받는다. 이름이나 연락처 같은 원문이 이벤트에 실리지 않게 형식을 좁힌다.
const UT_SESSION_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

/**
 * UT 진행자가 참가자마다 `?ut_session_id=UT01-P01` 링크를 한 번 열면 같은 저장소의 다음 이벤트에도 참가자 번호를 싣는다.
 * `?ut_session_id=0`으로 지운다. 형식에 맞지 않는 값은 저장하지도 싣지도 않는다.
 */
const readUtSessionId = (params: URLSearchParams): string | null => {
  const requested = params.get('ut_session_id');
  const isValid = requested !== null && requested !== '0' && UT_SESSION_PATTERN.test(requested);
  try {
    if (requested === '0') window.localStorage.removeItem(UT_SESSION_STORAGE_KEY);
    if (isValid) window.localStorage.setItem(UT_SESSION_STORAGE_KEY, requested);
    if (requested === '0') return null;
    return isValid ? requested : window.localStorage.getItem(UT_SESSION_STORAGE_KEY);
  } catch {
    // 저장소가 차단되어도 현재 링크의 참가자 번호는 싣는다.
    return isValid ? requested : null;
  }
};

/** 테스트 기기에서 한 번 설정한다. 계정 권한 판정에는 사용하지 않는다. */
export const getAnalyticsTrafficContext = (environment?: string) => {
  let isTestDevice = false;
  let utSessionId: string | null = null;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('analytics_test');
    isTestDevice = requested === '1';
    try {
      if (requested === '1') window.localStorage.setItem(STORAGE_KEY, '1');
      if (requested === '0') window.localStorage.removeItem(STORAGE_KEY);
      isTestDevice = requested === '1' || (requested !== '0' && window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // 저장소가 차단되어도 서비스 이용과 이벤트 전송은 계속한다.
    }
    utSessionId = readUtSessionId(params);
  }
  return {
    traffic_type: environment === 'development' ? 'development' : isTestDevice ? 'test' : 'external',
    ...(utSessionId === null ? {} : { ut_session_id: utSessionId }),
  };
};
