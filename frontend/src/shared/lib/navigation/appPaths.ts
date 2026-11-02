/** 로그인하면 보이는 홈. 로그인하지 않았으면 같은 주소에서 랜딩으로 보낸다. */
export const HOME_PATH = '/';
/** 본 방 기록(지도·리스트) 화면. */
export const RECORDS_PATH = '/properties';
/** 본 방 기록을 지도 보기로 연다. 매물은 지도의 빈 곳을 눌러 등록한다. */
export const RECORDS_MAP_PATH = `${RECORDS_PATH}?view=map`;
