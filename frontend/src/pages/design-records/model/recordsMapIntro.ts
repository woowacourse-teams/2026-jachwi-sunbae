const MAP_INTRO_SEEN_KEY = 'jachwi:records-map-intro-seen';

/** 본 방 기록 지도의 첫 진입 안내(지도를 눌러 추가하기)를 이미 봤는지. 저장소를 못 쓰면 본 것으로 쳐서 매번 띄우지 않는다. */
export const hasSeenRecordsMapIntro = (): boolean => {
  try {
    return localStorage.getItem(MAP_INTRO_SEEN_KEY) === 'true';
  } catch {
    return true;
  }
};

export const markRecordsMapIntroSeen = () => {
  try {
    localStorage.setItem(MAP_INTRO_SEEN_KEY, 'true');
  } catch {
    // 저장소를 쓸 수 없으면 이번 화면에서만 닫는다.
  }
};
