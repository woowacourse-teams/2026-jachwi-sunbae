import { css, cx } from '@emotion/css';
import { Link } from 'react-router-dom';

import { EVENT_PATH } from '@/shared/lib/navigation/appPaths';
import Icon from '@/shared/ui/icon/Icon';

type EventBannerProps = { className?: string };

/**
 * 오프라인 이벤트 기간에만 홈 헤더 아래에 두는 안내. 누르면 이벤트 미션 현황판(`/event`)으로 간다.
 * 이벤트가 끝나면 이 파일과 홈의 사용처를 지운다.
 */
const EventBanner = ({ className }: EventBannerProps) => (
  <aside className={cx(styles.banner, className)} aria-label="이벤트 안내">
    <Link className={styles.link} to={EVENT_PATH}>
      <span className={styles.text}>
        <span className={styles.description}>미션 6개를 끝내면 추첨을 통해 오리 인형을 드려요</span>
        <strong className={styles.title}>이벤트 미션 참여하기</strong>
      </span>
      <Icon name="chevron-right" size={18} />
    </Link>
  </aside>
);

const styles = {
  /* 사용방법 카드처럼 작은 보조 문구 아래 진한 파랑 제목을 두고, 옅은 파랑에서 노랑으로 넘어가는 바탕을 깐다. */
  banner: css`
    label: EventBanner-banner;
    display: flex;
    align-items: center;
    border-radius: var(--radius-card);
    background: linear-gradient(
      100deg,
      color-mix(in srgb, var(--color-brand-blue) 22%, #fff) 0%,
      color-mix(in srgb, var(--color-brand-blue) 10%, #fff) 55%,
      color-mix(in srgb, var(--color-brand-yellow) 40%, #fff) 100%
    );
    color: var(--color-brand-blue-ink);
  `,

  link: css`
    label: EventBanner-link;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.8rem 1rem 0.8rem 1.1rem;
    color: inherit;
    text-decoration: none;

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,

  text: css`
    label: EventBanner-text;
    display: grid;
    gap: 0.15rem;
    min-width: 0;
    word-break: keep-all;
  `,

  description: css`
    label: EventBanner-description;
    font-size: 0.78rem;
    font-weight: 600;
    opacity: 0.8;
  `,

  title: css`
    label: EventBanner-title;
    font-size: 1rem;
    letter-spacing: -0.02em;
  `,
};

export default EventBanner;
