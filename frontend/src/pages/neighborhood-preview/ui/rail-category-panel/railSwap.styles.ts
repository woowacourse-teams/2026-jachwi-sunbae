import { css, keyframes } from '@emotion/css';

/** 시트가 아래로 내려갔다가 다시 올라오며 새 목록을 보이는 움직임. 레일 칸을 바꾸면 시트를 새로 그려 이 움직임으로 연다. */
const sheetRise = keyframes`
  from {
    transform: translateY(55%);
  }

  to {
    transform: translateY(0);
  }
`;

/** 데스크탑 목록 칸은 짧게 아래에서 떠오르며 바뀐다. */
const panelRise = keyframes`
  from {
    opacity: 0;
    transform: translateY(0.6rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/** 휴대폰 시트(`BottomSheet`의 `className`)에 붙인다. 움직임을 줄인 설정이면 전환 없이 바꾼다. */
export const sheetSwap = css`
  label: railSwap-sheet;
  animation: ${sheetRise} 280ms cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** 데스크탑 목록 칸의 내용 묶음에 붙인다. */
export const panelSwap = css`
  label: railSwap-panel;
  animation: ${panelRise} 160ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
