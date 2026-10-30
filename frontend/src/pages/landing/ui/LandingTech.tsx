import { css } from '@emotion/css';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

type Layout = 'side' | 'stack';

type Pillar = {
  badge: string;
  tone: 'yellow' | 'blue';
  promise: string;
  description: string;
  metric: { value: string; unit: string; label: string };
  tags: string[];
  points: ReactNode[];
  figure?: ReactNode;
  condition?: string;
};

/* 5×5 칸 가운데 칸이 출발 지점, 둘레 8칸이 함께 보는 범위다. 가운데에서 가까운 칸부터 칠한다. */
const GRID_SIZE = 5;
const CENTER = 2;

/** 화면에 들어오면 한 번 비웠다가 가운데부터 다시 칠한다. 처음부터 끝 상태로 보이므로 감지가 안 돼도 그림은 완성돼 있다. */
const useReplayOnView = <T extends Element>() => {
  const ref = useRef<T>(null);
  const [isReset, setIsReset] = useState(false);

  useEffect(() => {
    const element = ref.current;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    if (!element || reduceMotion || typeof IntersectionObserver === 'undefined') return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setIsReset(true);
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => setIsReset(false));
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return { ref, isReset };
};

/** 격자 인덱스를 칸 몇 개로 줄여 보여준다. 전국 정류장 중 출발 칸과 둘레 8칸만 본다는 뜻이다. */
const GridFigure = () => {
  const { ref, isReset } = useReplayOnView<HTMLDivElement>();
  const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
    const row = Math.floor(index / GRID_SIZE);
    const column = index % GRID_SIZE;
    const distance = Math.max(Math.abs(row - CENTER), Math.abs(column - CENTER));
    return { index, kind: distance === 0 ? 'home' : distance === 1 ? 'near' : 'far', order: index };
  });
  return (
    <figure className={styles.gridCard}>
      <div
        ref={ref}
        className={styles.cells}
        data-reset={isReset}
        role="img"
        aria-label="5×5 칸 가운데 출발 칸과 둘레 8칸만 파랗게 칠한 그림"
      >
        {cells.map((cell) => (
          <span
            key={cell.index}
            className={styles.cell}
            data-kind={cell.kind}
            style={{ '--delay': `${0.1 + cell.order * 0.02}s` } as CSSProperties}
          >
            {cell.kind === 'home' && <i />}
          </span>
        ))}
      </div>
      <p className={styles.count}>
        <s>약 21만 정류장</s>
        <span aria-hidden="true">→</span>
        <small>걸어갈 후보</small>
        <strong>208곳</strong>
      </p>
    </figure>
  );
};

/** 시험 조건처럼 작게 붙이는 회색 글자. 스타일은 그릴 때 읽으므로 아래 styles보다 먼저 써도 된다. */
const Note = ({ children }: { children: ReactNode }) => <span className={styles.note}>{children}</span>;

const PILLARS: Pillar[] = [
  {
    badge: '빠르게',
    tone: 'yellow',
    promise: '넣자마자 지도가 칠해져요',
    description: '회사를 입력하고 기다릴 틈 없이, 60분 안에 갈 수 있는 동네가 바로 나와요.',
    metric: { value: '57.45', unit: 'ms', label: '검색 응답 p95' },
    tags: ['역방향 탐색', '격자 공간 인덱스'],
    points: [
      <>
        <b>탐색</b>: 동네 수만큼 길찾기를 하지 않고, 회사에서 출발해 노선을 따라가며 60분 안에 닿는 정류장을 한 번에
        모아요.
      </>,
      <>
        <b>걸어서 닿는 정류장 찾기</b>: 회사든 동네든 어떤 지점에서 걸어갈 수 있는 정류장을 찾을 때 21만 곳을 다 재지
        않아요. 0.01도(약 1km) 격자에서 그 지점의 칸과 둘레 8칸만 확인하고, 칸이 도보 10분 거리보다 커서 빠지는 정류장이
        없어요.
      </>,
      '노선은 미리 준비해 두고, 검색할 때마다 새로 불러오지 않아요.',
    ],
    figure: <GridFigure />,
    condition: '수도권, 35 RPS, 2시간 시험 · 평균 51.76ms, p99 297ms',
  },
  {
    badge: '꾸준하게',
    tone: 'yellow',
    promise: '사람이 몰려도 멈추지 않아요',
    description: '2시간 동안 쉬지 않고 검색이 들어와도 실패한 요청이 한 건도 없었어요.',
    metric: { value: '0', unit: '건', label: '25만 2천 건 중 오류' },
    tags: ['k6 부하 시험', 'GC 튜닝'],
    points: [
      '35 RPS로 2시간 동안 오류, 타임아웃, 드롭 0건, 컨테이너 재시작 0회였어요.',
      <>
        계산 중 쌓이던 객체를 원시 배열로 바꿔 GC 멈춤을 38초에서 0.24초로 줄였어요.{' '}
        <Note>(전국, 20 RPS, 2분 시험)</Note>
      </>,
      '2시간 시험에서 GC로 멈춘 시간은 누적 35.8초(0.5%), 한 번에 최대 348ms였어요.',
    ],
  },
  {
    badge: '정확하게',
    tone: 'blue',
    promise: '갈 수 있다고 나오면 정말 갈 수 있어요',
    description: '직선거리로 어림하지 않고 실제 버스, 지하철 노선으로 계산해요.',
    metric: { value: '117만', unit: '구간', label: '따라가는 전국 노선 구간' },
    tags: ['GTFS', '회귀 검증'],
    points: [
      'GTFS의 정류장과 구간 시간을 더해 도착 시간을 계산해요.',
      '최적화 전후로 목적지 5곳을 같은 조건으로 돌려, 찾은 정류장이 6,538곳으로 같은지 확인했어요.',
    ],
  },
];

/**
 * '속도랑 정확도' 섹션 본문. 한 줄마다 왼쪽은 사용자에게 하는 약속과 숫자,
 * 오른쪽은 그 약속을 지키는 기술과 시험 조건이다.
 */
const LandingTech = ({ layout }: { layout: Layout }) => (
  <div className={styles.pillars}>
    {PILLARS.map((pillar) => (
      <article key={pillar.badge} className={layout === 'side' ? styles.pillarSide : styles.pillarStack}>
        <div className={styles.forUser}>
          <span className={`${styles.badge} ${styles[pillar.tone]}`}>{pillar.badge}</span>
          <h3>{pillar.promise}</h3>
          <p>{pillar.description}</p>
          <p className={styles.metric}>
            <strong>
              {pillar.metric.value}
              <small>{pillar.metric.unit}</small>
            </strong>
            <span>{pillar.metric.label}</span>
          </p>
        </div>
        <div className={styles.forDev}>
          <div className={styles.tags}>
            {pillar.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <ul>
            {pillar.points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
          {pillar.figure}
          {pillar.condition && <p className={styles.condition}>{pillar.condition}</p>}
        </div>
      </article>
    ))}
  </div>
);

const styles = {
  pillars: css`
    label: LandingTech-pillars;
    display: grid;
    gap: 1.5rem;
  `,

  pillarSide: css`
    label: LandingTech-pillarSide;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    align-items: start;
    gap: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border);
  `,

  pillarStack: css`
    label: LandingTech-pillarStack;
    display: grid;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  `,

  forUser: css`
    label: LandingTech-forUser;
    min-width: 0;

    & h3 {
      margin: 0.625rem 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1.3;
      letter-spacing: -0.02em;
      word-break: keep-all;
      text-wrap: balance;
    }

    & > p:not([class]) {
      max-width: 30rem;
      margin: 0 0 1rem;
      color: var(--color-ink-soft);
      font-size: 0.95rem;
      line-height: 1.65;
      word-break: keep-all;
    }
  `,

  badge: css`
    label: LandingTech-badge;
    display: inline-block;
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
  `,

  yellow: css`
    label: LandingTech-yellow;
    background: var(--color-brand-yellow);
    color: var(--color-ink);
  `,

  blue: css`
    label: LandingTech-blue;
    background: var(--color-brand-blue);
    color: var(--color-on-card-accent);
  `,

  metric: css`
    label: LandingTech-metric;
    display: grid;
    gap: 0.125rem;
    margin: 0;

    & strong {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }

    & small {
      margin-left: 0.15rem;
      color: var(--color-ink-soft);
      font-size: 1rem;
      font-weight: 700;
    }

    & span {
      color: var(--color-muted);
      font-size: 0.85rem;
    }
  `,

  forDev: css`
    label: LandingTech-forDev;
    display: grid;
    align-content: start;
    gap: 0.75rem;
    min-width: 0;
    padding: 1.25rem;
    border-radius: var(--radius-lg);
    background: var(--color-surface-muted);

    & ul {
      display: grid;
      gap: 0.5rem;
      margin: 0;
      padding-left: 1.1rem;
      color: var(--color-ink-soft);
      font-size: 0.9rem;
      line-height: 1.55;
      word-break: keep-all;
    }
  `,

  tags: css`
    label: LandingTech-tags;
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;

    & span {
      padding: 0.125rem 0.5rem;
      border-radius: 0.375rem;
      background: color-mix(in srgb, var(--color-brand-blue) 14%, transparent);
      color: var(--color-brand-blue-ink);
      font-size: 0.72rem;
      font-weight: 700;
    }
  `,

  note: css`
    label: LandingTech-note;
    color: var(--color-muted);
    font-size: 0.78rem;
  `,

  condition: css`
    label: LandingTech-condition;
    margin: 0;
    color: var(--color-muted);
    font-size: 0.78rem;
  `,

  gridCard: css`
    label: LandingTech-gridCard;
    display: grid;
    gap: 1rem;
    margin: 0;
    padding: 1rem;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  `,

  cells: css`
    label: LandingTech-cells;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.4rem;
    width: min(100%, 12rem);
    margin: 0 auto;

    @media (prefers-reduced-motion: reduce) {
      & * {
        transition: none !important;
      }
    }
  `,

  /* 칸은 처음부터 끝 상태로 칠해 두고, data-reset일 때만 잠깐 비운다. */
  cell: css`
    label: LandingTech-cell;
    display: grid;
    aspect-ratio: 1;
    border-radius: 0.6rem;
    background: #eef1f5;
    place-items: center;
    transition:
      background 0.4s ease var(--delay),
      box-shadow 0.4s ease var(--delay);

    &[data-kind='near'] {
      background: #dce7f8;
      box-shadow: inset 0 0 0 2px #a9c4f0;
    }

    &[data-kind='home'] {
      background: var(--color-brand-blue);
    }

    & i {
      width: 38%;
      aspect-ratio: 1;
      border-radius: 50%;
      background: var(--color-brand-yellow);
      box-shadow: 0 0 0 3px var(--color-ink);
      transition: opacity 0.3s ease 0.1s;
    }

    [data-reset='true'] > & {
      background: #eef1f5;
      box-shadow: none;
      transition: none;
    }

    [data-reset='true'] > & i {
      opacity: 0;
      transition: none;
    }
  `,

  count: css`
    label: LandingTech-count;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: baseline;
    gap: 0.5rem;
    margin: 0;
    font-variant-numeric: tabular-nums;

    & s,
    & span {
      color: var(--color-muted);
      font-size: 0.95rem;
      text-decoration: none;
    }

    & small {
      color: var(--color-ink-soft);
      font-size: 0.85rem;
    }

    & strong {
      color: var(--color-brand-blue-ink);
      font-size: 1.5rem;
      font-weight: 800;
    }
  `,
};

export default LandingTech;
