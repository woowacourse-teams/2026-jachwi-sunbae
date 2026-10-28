import { css } from '@emotion/css';
import { Link } from 'react-router-dom';

import AuthenticatedPhoto from '@/features/property/ui/authenticated-photo/AuthenticatedPhoto';
import { RECORDS_PATH } from '@/shared/lib/navigation/appPaths';
import Icon from '@/shared/ui/icon/Icon';

import type { RecordsState } from '../hooks/useRecords';

type Props = {
  record: NonNullable<RecordsState['selected']>;
  onClose: () => void;
};

/** 휴대폰 지도에서 고른 방의 요약 카드. 카드를 누르면 상세 화면으로 간다. */
const RecordsSelectedCard = ({ record, onClose }: Props) => (
  <article className={styles.selectedCard}>
    <Link className={styles.selectedMain} to={`/properties/${record.id}`} state={{ returnTo: RECORDS_PATH }}>
      {record.representativePhoto ? (
        <AuthenticatedPhoto
          propertyId={Number(record.id)}
          photoId={record.representativePhoto.photoId}
          contentUrl={record.representativePhoto.contentUrl}
          alt={`${record.name} 대표 사진`}
          className={styles.selectedPhoto}
        />
      ) : (
        <span className={styles.selectedPhotoFallback} aria-hidden="true">
          <Icon name="home" size={22} />
        </span>
      )}
      <span className={styles.selectedDetails}>
        <strong>{record.name}</strong>
        <span>{record.price}</span>
      </span>
    </Link>
    <button className={styles.dismissCard} type="button" aria-label="매물 카드 닫기" onClick={onClose}>
      <Icon name="close" size={18} />
    </button>
  </article>
);

const styles = {
  /* 휴대폰 지도에서 고른 방을 지도 아래쪽에 띄우는 요약 카드. 누르면 상세로 간다. */
  selectedCard: css`
    label: RecordsSelectedCard-selectedCard;
    position: absolute;
    z-index: 20;
    right: 1.25rem;
    bottom: 1.75rem;
    left: 1.25rem;
    display: flex;
    align-items: stretch;
    min-height: 8.5rem;
    overflow: hidden;
    border: 1px solid #eceef1;
    border-radius: 0.8rem;
    background: white;
    box-shadow: 0 3px 14px #1e2b3d24;

    /* 태블릿 너비부터는 배치는 그대로 두고 글자와 여백만 키운다. */
    @media (min-width: 768px) {
      right: 1.5rem;
      left: 1.5rem;
      min-height: 10rem;
    }
  `,

  selectedMain: css`
    label: RecordsSelectedCard-selectedMain;
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: flex-start;
    gap: 0.75rem;
    color: inherit;
    text-decoration: none;
  `,

  selectedPhoto: css`
    label: RecordsSelectedCard-selectedPhoto;
    display: grid;
    width: 7rem;
    min-height: 8.5rem;
    flex: 0 0 auto;
    object-fit: cover;
    place-items: center;
    background: #eff1f5;
    color: #969da6;

    &.authenticated-photo {
      box-sizing: border-box;
      min-width: 0;
      gap: 0.25rem;
      padding: 0.35rem;
      overflow: hidden;
      font-size: 0.58rem;
      line-height: 1.25;
    }

    &.authenticated-photo > span {
      display: -webkit-box;
      max-width: 100%;
      overflow: hidden;
      overflow-wrap: anywhere;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }

    &.authenticated-photo .inline-button {
      min-height: 1.4rem;
      max-width: 100%;
      padding: 0.1rem 0.25rem;
      font-size: 0.6rem;
      line-height: 1.2;
      white-space: nowrap;
      text-underline-offset: 0.1rem;
    }

    @media (min-width: 768px) {
      width: 9rem;
      min-height: 10rem;
    }
  `,

  selectedPhotoFallback: css`
    label: RecordsSelectedCard-selectedPhotoFallback;
    display: grid;
    width: 7rem;
    min-height: 8.5rem;
    flex: 0 0 auto;
    object-fit: cover;
    place-items: center;
    background: #eff1f5;
    color: #969da6;

    @media (min-width: 768px) {
      width: 9rem;
      min-height: 10rem;
    }
  `,

  selectedDetails: css`
    label: RecordsSelectedCard-selectedDetails;
    display: grid;
    min-width: 0;
    align-self: flex-start;
    gap: 0.25rem;
    padding: 0.8rem 0 0.65rem;

    & strong,
    & > span,
    & small {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & strong {
      font-size: 0.9rem;
    }

    & > span {
      color: #42464e;
      font-size: 0.78rem;
      font-weight: 700;
    }

    @media (min-width: 768px) {
      & strong {
        font-size: 1.05rem;
      }
    }

    @media (min-width: 768px) {
      & > span {
        font-size: 0.92rem;
      }
    }
  `,

  dismissCard: css`
    label: RecordsSelectedCard-dismissCard;
    display: grid;
    width: 2.5rem;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    background: transparent;
    color: #9297a0;
    cursor: pointer;
  `,
};

export default RecordsSelectedCard;
