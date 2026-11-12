import { css, keyframes } from '@emotion/css';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { EVENT_PATH } from '@/shared/lib/navigation/appPaths';

import { readEventMissionRecord, subscribeEventMissionStepRecorded } from '../../model/eventMissionRecord';
import { EVENT_MISSIONS, getEventMissionCompletedAt } from '../../model/eventMissions';

const VISIBLE_MS = 2200;

/**
 * 미션 하나를 마친 순간 화면 위에서 짧게 내려오는 알림. 현황판(`/event`)에서는 카드가 바로 바뀌므로 띄우지 않는다.
 * 이벤트가 끝나면 이 파일과 `AppRoutes`의 사용처를 지운다.
 */
const EventMissionToast = () => {
  const { pathname } = useLocation();
  const [message, setMessage] = useState<{ key: number; text: string } | null>(null);

  useEffect(
    () =>
      subscribeEventMissionStepRecorded((step) => {
        if (window.location.pathname === EVENT_PATH) return;
        const mission = EVENT_MISSIONS.find((candidate) => candidate.steps.some((item) => item.step === step));
        const record = readEventMissionRecord();
        if (!mission || getEventMissionCompletedAt(mission, record) === null) return;
        const completedCount = EVENT_MISSIONS.filter(
          (item) => getEventMissionCompletedAt(item, record) !== null,
        ).length;
        setMessage({
          key: Date.now(),
          text: `미션 ${mission.number} 완료! (${completedCount}/${EVENT_MISSIONS.length})`,
        });
      }),
    [],
  );

  useEffect(() => {
    if (message === null) return;
    const timer = setTimeout(() => setMessage(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  if (message === null || pathname === EVENT_PATH) return null;
  return (
    <div key={message.key} className={styles.toast} role="status" aria-live="polite">
      {message.text}
    </div>
  );
};

const slideDownKeyframes = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, -150%);
  }
  12%, 85% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -150%);
  }
`;

const styles = {
  toast: css`
    label: EventMissionToast-toast;
    position: fixed;
    top: calc(0.75rem + env(safe-area-inset-top));
    left: 50%;
    z-index: 1000;
    padding: 0.6rem 1.1rem;
    border-radius: 999px;
    background: var(--color-brand-blue-ink);
    color: var(--color-on-card-accent);
    font-size: 0.88rem;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgb(0 0 0 / 16%);
    pointer-events: none;
    animation: ${slideDownKeyframes} ${VISIBLE_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
      transform: translateX(-50%);
    }
  `,
};

export default EventMissionToast;
