import { useEffect, useRef, useState } from 'react';
import mapRegisterVideo from '../assets/intro/intro-map-register.mp4';
import nearbyCompareVideo from '../assets/intro/intro-nearby-compare.mp4';
import quickRegisterVideo from '../assets/intro/intro-quick-register.mp4';
import styles from './IntroDemoPlayer.module.css';

type DemoChapter = {
  description: string;
  duration: string;
  title: string;
  video: string;
};

const PLAYBACK_RATE = 2;

const chapters: DemoChapter[] = [
  {
    title: '주소 없이 빠르게 기록',
    description: '갑자기 본 집도 이름·가격·발견 경로부터 저장하고, 메모와 방문 전 질문을 바로 남겨요.',
    duration: '약 33초',
    video: quickRegisterVideo,
  },
  {
    title: '현재 위치에서 매물 등록',
    description: '지금 서 있는 위치를 주소로 저장하고, 방문 전과 현장에서 확인한 내용을 단계별로 기록해요.',
    duration: '약 37초',
    video: mapRegisterVideo,
  },
  {
    title: '주변 시설과 모든 기록 비교',
    description: '매물 주변 생활 조건을 확인하고, 후보들의 사진·메모·체크 결과를 PDF로 한 번에 비교해요.',
    duration: '약 14초',
    video: nearbyCompareVideo,
  },
];

const IntroDemoPlayer = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const activeChapter = chapters[activeIndex];

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mediaQuery?.matches === true) setIsPaused(true);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (section === null || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => setIsInView(entry?.isIntersecting === true), {
      threshold: 0.35,
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;

    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
    if (!isInView || isPaused) {
      video.pause();
      return;
    }

    const playAttempt = video.play();
    playAttempt?.catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'NotAllowedError') setIsPaused(true);
    });
  }, [activeIndex, isInView, isPaused]);

  const togglePlayback = () => setIsPaused((paused) => !paused);
  const selectChapter = (index: number) => {
    if (index === activeIndex && videoRef.current !== null) videoRef.current.currentTime = 0;
    setActiveIndex(index);
    setIsPaused(false);
  };

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="demo-heading">
      <div className={styles.heading}>
        <p>말로만 설명하지 않을게요</p>
        <h2 id="demo-heading">갑자기 본 집부터 비교 PDF까지, 실제 사용 흐름을 확인하세요.</h2>
        <span>주소를 몰라도 먼저 기록하고, 현장에서 확인하고, 주변 생활 조건과 모든 기록을 비교합니다.</span>
      </div>

      <div className={styles.layout}>
        <div className={styles.playerCard}>
          <div className={styles.screen}>
            <video
              key={activeChapter.video}
              ref={videoRef}
              src={activeChapter.video}
              aria-label={`${activeChapter.title} 사용 예시 영상, 2배속`}
              autoPlay={isInView && !isPaused}
              muted
              playsInline
              preload="metadata"
              onEnded={() => setActiveIndex((index) => (index + 1) % chapters.length)}
              onLoadedMetadata={(event) => {
                event.currentTarget.defaultPlaybackRate = PLAYBACK_RATE;
                event.currentTarget.playbackRate = PLAYBACK_RATE;
              }}
            />
          </div>

          <div className={styles.playerMeta} aria-live="polite">
            <div>
              <span>
                {String(activeIndex + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
              </span>
              <strong>{activeChapter.title}</strong>
            </div>
            <button type="button" onClick={togglePlayback} aria-pressed={isPaused}>
              <i aria-hidden="true" data-paused={isPaused || undefined} />
              {isPaused ? '재생' : '일시정지'}
            </button>
          </div>
        </div>

        <ol className={styles.chapterList} aria-label="사용 예시 영상 순서">
          {chapters.map((chapter, index) => (
            <li key={chapter.title}>
              <button
                type="button"
                data-active={index === activeIndex || undefined}
                aria-pressed={index === activeIndex}
                onClick={() => selectChapter(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{chapter.title}</strong>
                  <p>{chapter.description}</p>
                  <small>2배속 · {chapter.duration}</small>
                </div>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <p className={styles.exampleNotice}>영상의 매물 정보는 서비스 사용을 설명하기 위한 예시입니다.</p>
    </section>
  );
};

export default IntroDemoPlayer;
