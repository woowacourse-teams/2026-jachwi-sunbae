// 안드로이드 앱 웹뷰 시나리오 정의. 측정(measure-android.mjs), 이력(calibration-history.mjs), 판정(calibration-judge.mjs)이 같이 쓴다.
// 시나리오의 흐름이나 재는 순간을 바꾸면 version 을 올린다. 이력 비교는 version 이 다른 기록을 "조건 바뀜"으로 보고 기준에서 뺀다.
// metric 은 판정에 쓰는 값(ms)이다. 단계(phases)는 기록과 이슈 본문에만 쓴다.
export const SCENARIOS = {
  cold: { version: 1, label: '빈 캐시 첫 방문: 첫 목록 카드', metric: 'moment' },
  warm: { version: 1, label: '같은 캐시로 재방문: 첫 목록 카드', metric: 'moment' },
  register: { version: 1, label: '방 등록: "추가"를 누르고 새 방 항목이 보이기까지', metric: 'total' },
  'geo-slow': {
    version: 1,
    label: '위치 응답 지연 뒤 방 등록: "현재 위치로 이동"부터 새 방 항목까지(위치 3초 지연)',
    metric: 'total',
  },
  denied: {
    version: 1,
    label: '위치 거부 뒤 방 등록: 거부 알림, 주소 검색 선택, 권한을 켜고 다시 등록',
    metric: 'total',
  },
  'fail-reset': {
    version: 1,
    label: '저장 실패 뒤 초기화: 실패 알림까지, 목 상태 그대로인지, 다시 눌러 등록',
    metric: 'failNotice',
  },
};

// 위치 응답 지연 시나리오가 늦추는 시간. 앱의 위치 요청 제한(8초, 15초)보다 짧게 둔다.
export const GEO_DELAY_MS = 3000;

// 환경 오류(기기, 연결, 웹뷰 붙기)는 앱 문제가 아니라 판정에서 뺀다. measure-android.mjs 가 오류 앞에 이 표시를 붙인다.
export const ENV_ERROR_PREFIX = '환경 오류: ';
export const isEnvironmentError = (message) =>
  typeof message === 'string' &&
  (message.startsWith(ENV_ERROR_PREFIX) ||
    /adb|device|WebView has been closed|Target( page, context or browser)? (has been )?closed|ECONNREFUSED|ERR_CONNECTION_REFUSED|socket hang up/i.test(
      message,
    ));
