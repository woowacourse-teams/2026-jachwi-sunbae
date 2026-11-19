import { css, cx } from '@emotion/css';

import iconHome from '@/shared/assets/illustrations/icon-home.webp';
import iconMap from '@/shared/assets/illustrations/icon-map.webp';

import { Button } from '../button/Button';

type Props = { mode: 'records' | 'neighborhoods'; onClick: () => void; className?: string };

/** 지도 아래 가운데에 띄우는 알약형 모드 전환 버튼. 지금 모드의 반대 모드(`mode`)로 넘어간다. 자리는 화면이 `className`으로 정한다. */
const MapModeButton = ({ mode, onClick, className }: Props) => (
  <Button className={cx(mapFloatingPill, className)} onClick={onClick}>
    <img src={mode === 'records' ? iconHome : iconMap} alt="" width={22} height={22} />
    {mode === 'records' ? '내 기록으로' : '출퇴근 시간으로 동네 찾기'}
  </Button>
);

/**
 * 지도 아래에 띄우는 알약형 버튼 모양. 흰 지도와 시트 위에서도 눈에 띄게 진한 파랑 바탕에 흰 테두리를 둔다.
 * 동네 찾기의 `출퇴근 장소 다시 선택`도 같은 모양을 쓴다.
 */
export const mapFloatingPill = css`
  label: MapFloatingPill;
  gap: 0.4rem;
  border: 2px solid var(--color-surface);
  border-radius: 999px;
  background: var(--color-brand-blue-ink);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-floating);
  font-size: 0.875rem;
  white-space: nowrap;
  pointer-events: auto;

  &:hover:not(:disabled) {
    background: var(--color-brand-blue-ink);
  }
  & img {
    flex: none;
    width: 22px;
    height: 22px;
    object-fit: contain;
  }
  & > span {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
`;

export default MapModeButton;
