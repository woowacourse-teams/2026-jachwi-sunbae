import { css } from '@emotion/css';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { usePropertyCommuteTimes } from '@/features/property/api/useProperties';
import type { PropertyCommuteTime } from '@/features/property/model/Property';
import { propertyDetailPath } from '@/shared/lib/navigation/appPaths';

type Props = {
  destination: { name: string; latitude: number; longitude: number };
  onOpen: () => void;
};

/** 매물 한 줄의 통근 시간. 서버는 정해 둔 시간과 환승 안에서만 시간을 구한다. */
export const propertyCommuteLabel = (commute: PropertyCommuteTime, maxMinutes: number) => {
  if (commute.status === 'NO_LOCATION') return '위치 없음';
  if (commute.status === 'UNREACHABLE') return `${maxMinutes}분 넘게`;
  return `${commute.commuteMinutes}분`;
};

/** 가까운 매물부터, 못 가는 매물, 위치 없는 매물 순으로 둔다. */
const commuteOrder = (commute: PropertyCommuteTime) =>
  commute.status === 'REACHABLE' ? (commute.commuteMinutes ?? 0) : commute.status === 'UNREACHABLE' ? 10_000 : 20_000;

/**
 * 본 방 기록에 남긴 매물마다 이번에 고른 출퇴근 장소까지 대중교통 시간을 보여 준다. 동네 시세, 통근 시간과 견주어 보게 한다.
 * 기록한 매물이 없거나 아직 받지 못했거나 받지 못하면 아무것도 그리지 않는다. 누르면 그 매물 상세로 간다.
 */
const PropertyCommuteList = ({ destination, onOpen }: Props) => {
  const commute = usePropertyCommuteTimes(destination);
  const rows = useMemo(
    () =>
      (commute.data?.properties ?? [])
        .filter((item) => item.propertyName.trim() !== '')
        .sort((left, right) => commuteOrder(left) - commuteOrder(right) || left.propertyId - right.propertyId),
    [commute.data],
  );
  if (!commute.data || rows.length === 0) return null;
  return (
    <section className={styles.section} aria-label="내 매물 통근 시간">
      <h3>내 매물에서 {destination.name}까지</h3>
      <ul>
        {rows.map((row) => (
          <li key={row.propertyId}>
            <Link to={propertyDetailPath(row.propertyId)} onClick={onOpen}>
              <span>{row.propertyName}</span>
              <small data-status={row.status}>{propertyCommuteLabel(row, commute.data.maxMinutes)}</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

const styles = {
  section: css`
    label: PropertyCommuteList-section;
    display: grid;
    gap: 0.35rem;

    & h3 {
      margin: 0;
      overflow: hidden;
      color: var(--color-ink-soft);
      font-size: 0.8rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & ul {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    & a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 0.25rem;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-ink);
      text-decoration: none;
    }

    & a:hover {
      background: var(--color-surface-muted);
    }

    & span {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font-size: 0.88rem;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & small {
      flex: none;
      color: var(--color-primary-dark);
      font-size: 0.8rem;
      font-weight: 700;
    }

    & small[data-status='UNREACHABLE'],
    & small[data-status='NO_LOCATION'] {
      color: var(--color-muted);
      font-weight: 600;
    }
  `,
};

export default PropertyCommuteList;
