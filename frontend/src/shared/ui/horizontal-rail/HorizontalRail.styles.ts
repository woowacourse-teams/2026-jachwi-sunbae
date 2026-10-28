import { css } from '@emotion/css';

export const rail = css`
  label: HorizontalRail-rail;
  display: flex;
  gap: var(--horizontal-rail-gap, 0.55rem);
  margin-inline: calc(-1 * var(--horizontal-rail-bleed, 0px));
  padding-inline: var(--horizontal-rail-bleed, 0px);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scroll-padding-inline: var(--horizontal-rail-bleed, 0px);
  scrollbar-width: none;
  cursor: grab;
  user-select: none;
  touch-action: pan-x pan-y;

  &::-webkit-scrollbar {
    display: none;
  }

  & > * {
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  &[data-dragging='true'] {
    cursor: grabbing;
    scroll-snap-type: none;
  }

  &[data-dragging='true'] > * {
    cursor: grabbing;
  }
`;
