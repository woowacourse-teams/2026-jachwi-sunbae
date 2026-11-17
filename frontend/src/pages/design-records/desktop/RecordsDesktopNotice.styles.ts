import { css } from '@emotion/css';

/*
 * 본 방 기록 뼈대(RecordsPageSkeleton)가 RecordsDesktopPage.styles를 main 번들로 가져가므로,
 * 뼈대가 쓰지 않는 알림 위치는 화면 코드와 함께 늦게 받도록 따로 둔다.
 */
export const notice = css`
  label: RecordsDesktopPage-notice;
  /* 토스트 기본 위치(좌우 1rem)보다 앞서도록 선택자를 두 번 겹친다. 아래 가운데에 띄운다. */
  && {
    right: 0;
    bottom: 1.5rem;
    left: 0;
    width: min(22rem, calc(100% - 2rem));
    margin-inline: auto;
  }
`;
