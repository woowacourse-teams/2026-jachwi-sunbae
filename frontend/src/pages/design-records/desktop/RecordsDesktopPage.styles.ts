import { css } from '@emotion/css';

/* 데스크탑 본 방 기록: 화면 전체를 쓰며 왼쪽에 리스트(또는 매물 등록·상세 칸), 오른쪽에 지도를 나란히 둔다. */
export const page = css`
  label: RecordsDesktopPage-page;
  height: 100dvh;
  background: #f0f2f5;
  color: #25282d;
`;

export const frame = css`
  label: RecordsDesktopPage-frame;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: white;
  overflow: hidden;

  & button:focus-visible {
    outline: 2px solid #25282d;
    outline-offset: 3px;
  }
`;

export const body = css`
  label: RecordsDesktopPage-body;
  display: grid;
  flex: 1;
  grid-template-areas: 'list map';
  grid-template-columns: 28rem minmax(0, 1fr);
  min-height: 0;
`;

export const list = css`
  label: RecordsDesktopPage-list;
  grid-area: list;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1.5rem 1.5rem;
  border-right: 1px solid #eceef1;
  background: white;
`;

/* 매물 등록·상세는 리스트 자리에 연다. 두 화면이 자체 여백을 가지므로 리스트 여백은 뺀다. */
export const sidePanel = css`
  label: RecordsDesktopPage-sidePanel;
  padding: 0;
`;

export const map = css`
  label: RecordsDesktopPage-map;
  grid-area: map;
`;

export const notice = css`
  label: RecordsDesktopPage-notice;
  right: 1.5rem;
  bottom: 1.5rem;
  left: auto;
  width: 22rem;
`;
