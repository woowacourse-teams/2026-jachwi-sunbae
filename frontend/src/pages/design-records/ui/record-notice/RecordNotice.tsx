import { css } from '@emotion/css';

import Icon from '@/shared/ui/icon/Icon';

type RecordNoticeProps = {
  message: string;
  onClose: () => void;
  className?: string;
};

/** 기록 삭제·등록 뒤 화면 아래에 잠깐 띄우는 안내. */
const RecordNotice = ({ message, onClose, className }: RecordNoticeProps) =>
  message ? (
    <div className={`${styles.notice} ${className ?? ''}`.trim()} role="status">
      {message}
      <button type="button" aria-label="안내 닫기" onClick={onClose}>
        <Icon name="close" size={16} />
      </button>
    </div>
  ) : null;

const styles = {
  notice: css`
    label: RecordNotice-notice;
    position: absolute;
    left: 1rem;
    right: 1rem;
    bottom: 5.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.9rem;
    background: #333943;
    color: white;
    border-radius: 0.7rem;
    font-size: 0.75rem;
    line-height: 1.5;

    & button {
      border: 0;
      padding: 0.2rem;
      display: grid;
      place-items: center;
      color: white;
      background: transparent;
      cursor: pointer;
    }

    & button:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }

    @media (min-width: 768px) {
      font-size: 0.85rem;
    }
  `,
};

export default RecordNotice;
