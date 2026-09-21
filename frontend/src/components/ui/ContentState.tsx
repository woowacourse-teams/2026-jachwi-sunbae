import type { ReactNode } from 'react';
import mascotImage from '../../assets/empty-property.jpg';

type ContentStateProps = {
  /** 화면 전체를 차지하는 상태인지. 목록 안에 끼워 넣을 때는 끈다. */
  page?: boolean;
  tone?: 'info' | 'error';
  /** 켜면 spinner와 함께 제목을 본문으로 읽어 준다. */
  loading?: boolean;
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  /** 돌아가기 링크처럼 상태에 딸린 추가 동작. */
  children?: ReactNode;
};

/** 로딩·오류·빈 주소처럼 화면 대신 보여 주는 안내를 한 곳에서 그린다. */
const ContentState = ({
  page = true,
  tone = 'info',
  loading = false,
  title,
  description,
  onRetry,
  retryLabel = '다시 시도',
  children,
}: ContentStateProps) => {
  const body = (
    <div
      className={`content-state ${tone === 'error' ? 'content-state--error' : ''} ${loading ? 'content-state--loading' : ''}`.trim()}
      role={tone === 'error' ? 'alert' : loading ? 'status' : undefined}
    >
      {tone === 'error' && !loading ? (
        <span className="content-state__mascot" aria-hidden="true">
          <img src={mascotImage} alt="" />
        </span>
      ) : loading ? (
        <span className="content-state__skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : null}
      {title !== undefined && (loading ? title : <strong>{title}</strong>)}
      {description !== undefined && <span>{description}</span>}
      {onRetry !== undefined && (
        <button type="button" className="inline-button" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
      {children}
    </div>
  );

  if (!page) return body;

  return (
    <main className="property-page">
      <div className="page-container">{body}</div>
    </main>
  );
};

export default ContentState;
