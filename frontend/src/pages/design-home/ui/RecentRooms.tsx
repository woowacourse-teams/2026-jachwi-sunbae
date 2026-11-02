import { css, cx, keyframes } from '@emotion/css';

import { usePropertyList } from '@/features/property/api/useProperties';
import { formatRentSummary } from '@/features/property/lib/propertyFormat';
import AuthenticatedPhoto from '@/features/property/ui/authenticated-photo/AuthenticatedPhoto';
import { HOME_PATH, propertyDetailPath } from '@/shared/lib/navigation/appPaths';
import { Button } from '@/shared/ui/button/Button';
import HorizontalRail from '@/shared/ui/horizontal-rail/HorizontalRail';
import Icon from '@/shared/ui/icon/Icon';
import RailCard from '@/shared/ui/rail-card/RailCard';

const RECENT_ROOM_LIMIT = 5;
const SKELETON_CARD_COUNT = 3;

type RecentRoomsProps = {
  /** 켜면 좁은 오른쪽 열에 맞게 카드를 두 장 남짓 보이도록 둔다(데스크탑). */
  inSideColumn?: boolean;
};

const RecentRooms = ({ inSideColumn = false }: RecentRoomsProps) => {
  const properties = usePropertyList();
  const rooms = properties.data?.pages.flatMap((page) => page.content).slice(0, RECENT_ROOM_LIMIT) ?? [];
  return (
    <section className={styles.section} data-side-column={inSideColumn || undefined} aria-labelledby="recent-heading">
      <div className={styles.sectionHeading}>
        <h2 id="recent-heading">최근 기록한 방</h2>
      </div>
      {/*
        기록을 처음 받을 때는 남겨 둘 내용이 없으므로, 늦추지 않고 카드 뼈대를 바로 두었다가 카드로 한 번만 바꾼다.
        뼈대, 카드, 빈 기록 안내가 같은 높이를 쓰도록 보이지 않는 카드 한 줄로 칸 높이를 잡아 둔다.
      */}
      <div className={styles.body}>
        <div className={`${styles.rooms} ${styles.sizer}`} aria-hidden="true">
          <RoomCardSkeleton />
        </div>
        {properties.isPending ? (
          <RecentRoomsSkeleton />
        ) : properties.isError ? (
          <div className={styles.loadError} role="alert">
            {/* 불러오기 실패 이미지는 준비되면 이 자리에 넣는다. */}
            <span className={styles.loadErrorImage} aria-hidden="true" />
            <p>기록을 불러오지 못했어요.</p>
            <Button variant="secondary" isLoading={properties.isFetching} onClick={() => void properties.refetch()}>
              다시 시도
            </Button>
          </div>
        ) : rooms.length === 0 ? (
          <p>아직 기록한 방이 없어요.</p>
        ) : (
          <HorizontalRail className={styles.rooms} aria-label="최근 기록한 방 목록">
            {rooms.map((property) => (
              <RailCard
                // 데스크탑은 같은 주소에서 본 방 기록 화면이 이 매물을 고른 채로 열린다.
                to={propertyDetailPath(property.propertyId)}
                state={{ returnTo: HOME_PATH }}
                key={property.propertyId}
                className={styles.roomCard}
              >
                {property.representativePhoto ? (
                  <AuthenticatedPhoto
                    propertyId={property.propertyId}
                    photoId={property.representativePhoto.photoId}
                    contentUrl={property.representativePhoto.contentUrl}
                    alt={`${property.name} 대표 사진`}
                    className={styles.roomPicture}
                    errorMode="retry-only"
                  />
                ) : (
                  <span className={`${styles.roomPicture} ${styles.photoFallback}`} aria-label="대표 사진 없음">
                    <Icon name="image" size={18} />
                  </span>
                )}
                <div className={styles.roomInfo}>
                  <strong>{property.name}</strong>
                  <span className={styles.rent}>
                    {property.monthlyRentAmount > 0 ? '월세 ' : ''}
                    {formatRentSummary(property.depositAmount, property.monthlyRentAmount)}
                  </span>
                  <p>{property.location.address ?? '주소 미등록'}</p>
                </div>
              </RailCard>
            ))}
          </HorizontalRail>
        )}
      </div>
    </section>
  );
};

/** 최근 기록 카드와 같은 구조의 뼈대 카드. 글자 줄에 실제와 같은 글꼴의 한글 한 글자를 투명하게 넣어 줄 높이까지 실제 카드와 같다. */
const RoomCardSkeleton = () => (
  <div className={styles.roomCard}>
    <span className={`${styles.roomPicture} ${styles.skeleton}`} />
    <div className={`${styles.roomInfo} ${styles.skeletonInfo}`}>
      <strong className={styles.skeleton}>가</strong>
      <span className={`${styles.rent} ${styles.skeleton}`}>가</span>
      <p className={styles.skeleton}>가</p>
    </div>
  </div>
);

/** 기록을 받는 동안의 카드 뼈대. 읽기 프로그램에는 불러오는 중이라고만 알린다. */
const RecentRoomsSkeleton = () => (
  <div role="status">
    <span className="sr-only">기록을 불러오는 중이에요.</span>
    <div className={`${styles.rooms} ${styles.skeletonRail}`} aria-hidden="true">
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <RoomCardSkeleton key={index} />
      ))}
    </div>
  </div>
);

const skeletonShimmer = keyframes`
  to {
    background-position: -200% 0;
  }
`;

const styles = {
  // 다른 요소의 선택자에서 `.RecentRooms-section`로 가리킨다.
  section: cx(
    css`
      label: RecentRooms-section;
      margin-top: 2.2rem;
    `,
    'RecentRooms-section',
  ),

  sectionHeading: css`
    label: RecentRooms-sectionHeading;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.9rem;

    & h2 {
      font-size: 1rem;
      margin: 0;
      letter-spacing: -0.035em;
    }
  `,

  /* 불러오기에 실패하면 이미지·안내·다시 시도 버튼을 가운데에 세로로 둔다. */
  loadError: css`
    label: RecentRooms-loadError;
    display: grid;
    justify-items: center;
    gap: 0.75rem;
    padding: 1.25rem 0 0.5rem;
    text-align: center;

    & p {
      margin: 0;
      color: var(--color-muted);
      font-size: 0.85rem;
    }
  `,

  /* 이미지가 들어올 자리. 크기만 잡아 둔다. */
  loadErrorImage: css`
    label: RecentRooms-loadErrorImage;
    width: 6rem;
    height: 6rem;
    border-radius: var(--radius-tile);
    background: var(--color-card-surface);
  `,

  rooms: css`
    label: RecentRooms-rooms;
    /* 홈 본문 좌우 패딩만큼 화면 끝까지 카드를 흘려 다음 카드가 있다는 걸 보여준다. */
    --horizontal-rail-bleed: 1.25rem;
    --horizontal-rail-gap: 0.7rem;
    padding-bottom: 0.25rem;

    @media (max-width: 360px) {
      --horizontal-rail-bleed: 1rem;
    }

    /* 데스크탑 오른쪽 열처럼 좁은 칸에서는 가장자리 여백 없이 카드를 두 장 남짓 보이게 한다. */
    .RecentRooms-section[data-side-column='true'] & {
      --horizontal-rail-bleed: 0px;
      --horizontal-rail-gap: 0.75rem;
    }
  `,

  /* 동작은 공통 RailCard가 맡고, 여기서는 사진 위·정보 아래로 된 카드 모양만 정한다. */
  roomCard: css`
    label: RecentRooms-roomCard;
    flex: 0 0 42%;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-tile);
    background: var(--color-surface);

    @media (max-width: 360px) {
      flex-basis: 52%;
    }

    /* 넓은 화면에서도 카드는 모바일 크기로 두고 한 줄에 더 많이 보여준다. */
    @media (min-width: 768px) {
      flex-basis: 11rem;
    }

    .RecentRooms-section[data-side-column='true'] & {
      flex-basis: calc((100% - var(--horizontal-rail-gap)) / 2.2);
    }
  `,

  roomPicture: css`
    label: RecentRooms-roomPicture;
    display: grid;
    place-items: center;
    width: 100%;
    height: 7rem;
    position: relative;
    overflow: hidden;
    flex: 0 0 auto;
    border-radius: 0.7rem;
    object-fit: cover;
    background: var(--color-card-surface);
    color: var(--color-placeholder);

    &.authenticated-photo {
      box-sizing: border-box;
      aspect-ratio: auto;
      gap: 0.2rem;
      padding: 0.3rem;
      font-size: 0.58rem;
      line-height: 1.2;
    }

    &.authenticated-photo .inline-button {
      min-height: 1.5rem;
      padding: 0.1rem 0.25rem;
      font-size: 0.58rem;
      text-decoration: none;
    }
  `,

  /* 높이 기준 카드와 실제 내용을 같은 칸에 겹쳐, 둘 중 큰 높이를 쓴다. */
  body: css`
    label: RecentRooms-body;
    display: grid;

    & > * {
      grid-area: 1 / 1;
      min-width: 0;
    }
  `,

  /* 보이지 않는 높이 기준 카드. 화면에서는 자리만 차지한다. */
  sizer: css`
    label: RecentRooms-sizer;
    visibility: hidden;
    pointer-events: none;
  `,

  /* 뼈대 카드는 넘겨 볼 필요가 없어 가로 레일 대신 한 줄에 두고 넘치는 카드는 자른다. */
  skeletonRail: css`
    label: RecentRooms-skeletonRail;
    display: flex;
    gap: var(--horizontal-rail-gap);
    overflow: hidden;
  `,

  skeleton: css`
    label: RecentRooms-skeleton;
    display: block;
    border-radius: 0.4rem;
    background: linear-gradient(90deg, #eff1f5 25%, #e3e6eb 50%, #eff1f5 75%);
    background-size: 200% 100%;
    animation: ${skeletonShimmer} 1.2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,

  /* 뼈대 글자 줄은 글자를 감추고 줄마다 길이만 다르게 둔다. */
  skeletonInfo: css`
    label: RecentRooms-skeletonInfo;

    .RecentRooms-roomInfo& > * {
      color: transparent;
    }

    .RecentRooms-roomInfo& > strong {
      width: 70%;
    }

    .RecentRooms-roomInfo& > span {
      width: 50%;
    }

    .RecentRooms-roomInfo& > p {
      width: 85%;
    }
  `,

  photoFallback: css`
    label: RecentRooms-photoFallback;
    align-content: center;
    justify-items: center;
  `,

  // 다른 요소의 선택자에서 `.RecentRooms-roomInfo`로 가리킨다.
  roomInfo: cx(
    css`
      label: RecentRooms-roomInfo;
      display: grid;
      min-width: 0;
      align-content: start;
      gap: 0.25rem;
      padding: 0.8rem 0.7rem;

      & > strong {
        overflow: hidden;
        color: var(--color-ink);
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: -0.04em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      & p {
        overflow: hidden;
        margin: 0;
        color: var(--color-muted);
        font-size: 0.68rem;
        line-height: 1.35;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
    'RecentRooms-roomInfo',
  ),

  rent: css`
    label: RecentRooms-rent;

    .RecentRooms-roomInfo > & {
      overflow: hidden;
      color: var(--color-price);
      font-size: 0.78rem;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
};

export default RecentRooms;
