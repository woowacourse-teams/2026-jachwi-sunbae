import { css } from '@emotion/css';
import { useRef } from 'react';

import Icon from '@/shared/ui/icon/Icon';

import { acceptedPhotoTypes, MAX_PROPERTY_PHOTOS, usePhotoUploadQueue } from '../../model/usePhotoUploadQueue';

type PhotoUploadPanelProps = {
  propertyId: number;
  currentPhotoCount: number;
};

const PhotoUploadPanel = ({ propertyId, currentPhotoCount }: PhotoUploadPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadQueue = usePhotoUploadQueue(propertyId, currentPhotoCount);
  const isLimitReached = currentPhotoCount >= MAX_PROPERTY_PHOTOS;
  const uploadErrors = uploadQueue.items.filter((item) => item.status === 'error');

  return (
    <section className={styles.root} aria-labelledby="photo-upload-heading">
      <h2 className="sr-only" id="photo-upload-heading">
        사진 추가
      </h2>
      <label
        className={styles.tile}
        data-disabled={uploadQueue.isUploading || isLimitReached}
        htmlFor="property-photo-files"
      >
        <Icon name="image" size={25} />
        <strong aria-hidden="true">{uploadQueue.isUploading ? '추가 중' : '추가'}</strong>
        <small aria-hidden="true">
          {currentPhotoCount}/{MAX_PROPERTY_PHOTOS}
        </small>
        <span className="sr-only">사진 파일 선택</span>
      </label>
      <input
        id="property-photo-files"
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={acceptedPhotoTypes.join(',')}
        multiple
        disabled={uploadQueue.isUploading || isLimitReached}
        aria-label="사진 파일 선택"
        aria-describedby="photo-upload-help"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          void uploadQueue.uploadFiles(files);
          event.target.value = '';
        }}
      />
      <p id="photo-upload-help" className="sr-only">
        JPEG·PNG·WebP 형식을 사진당 5MiB 이하로 선택할 수 있어요. 원본 파일명은 저장하지 않아요.
      </p>
      {isLimitReached && (
        <p className={`${styles.feedback} form-notice`} role="status">
          사진 30장이 모두 등록되어 추가할 수 없어요.
        </p>
      )}
      {uploadErrors.length > 0 && (
        <div className={`${styles.feedback} ${styles.errorList}`} role="alert">
          {uploadErrors.map((item) => (
            <p key={item.id}>{item.message}</p>
          ))}
        </div>
      )}
    </section>
  );
};

const styles = {
  root: css`
    label: PhotoUploadPanel-root;
    display: contents;
  `,

  tile: css`
    label: PhotoUploadPanel-tile;
    display: grid;
    aspect-ratio: 1;
    align-content: center;
    justify-items: center;
    gap: 0.25rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-neutral);
    color: var(--color-muted);
    cursor: pointer;
    transition: background-color 160ms ease;

    &:hover:not([data-disabled='true']) {
      background: var(--color-search-surface);
    }

    & strong {
      font-size: 0.78rem;
    }

    & small {
      color: var(--color-muted);
      font-size: 0.64rem;
    }

    &[data-disabled='true'] {
      cursor: not-allowed;
      opacity: 0.55;
    }
  `,

  feedback: css`
    label: PhotoUploadPanel-feedback;
    grid-column: 1 / -1;
  `,

  errorList: css`
    label: PhotoUploadPanel-errorList;
    color: var(--color-error);
    font-size: 0.7rem;
    line-height: 1.45;

    & p {
      margin: 0;
    }

    & p + p {
      margin-top: 0.2rem;
    }
  `,
};

export default PhotoUploadPanel;
