import { css } from '@emotion/css';

import { useMember } from '@/features/auth/api/useCurrentMember';

import useEventMissionBoard from './hooks/useEventMissionBoard';
import MissionCard, { LIST_GAP } from './ui/mission-card/MissionCard';
import MissionProgress from './ui/mission-progress/MissionProgress';

/**
 * 이벤트 미션 현황판(`/event`). 오프라인 이벤트 참가자가 자기 폰에서 미션을 마치면 체크가 켜지고,
 * 다 모으면 운영진이 이 화면을 보고 상품을 준다. 회원 번호는 운영진이 중복 수령을 확인하는 데 쓴다.
 * 데스크탑과 휴대폰 모두 미션을 세로 단계로 한 열에 놓는다.
 */
const EventMissionPage = () => {
  const { memberId } = useMember();
  const board = useEventMissionBoard();

  return (
    <main className={styles.page}>
      <MissionProgress
        completedCount={board.completedCount}
        totalCount={board.totalCount}
        allCompletedAt={board.allCompletedAt}
        memberId={memberId}
      />
      <ol className={styles.missions} aria-label="미션 목록">
        {board.missions.map((item) => (
          <MissionCard key={item.mission.number} {...item} />
        ))}
      </ol>
      <footer className={styles.footer}>
        <span>{`회원 번호 ${memberId}`}</span>
        <span>미션 기록은 이 기기에 남아요.</span>
      </footer>
    </main>
  );
};

const styles = {
  /* 마이처럼 좁은 한 열을 화면 가운데에 둔다. 데스크탑은 앱 셸이 기준 글자 크기를 키우므로 같은 값을 쓴다. */
  page: css`
    label: EventMissionPage-page;
    display: grid;
    align-content: start;
    gap: 0.6rem;
    width: min(100%, 26rem);
    min-height: 100%;
    margin-right: auto;
    margin-left: auto;
    padding: 0.75rem 1rem 1.5rem;
    background: var(--color-canvas);
  `,

  missions: css`
    label: EventMissionPage-missions;
    display: grid;
    gap: ${LIST_GAP};
    margin: 0;
    padding: 0;
  `,

  footer: css`
    label: EventMissionPage-footer;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.25rem 1rem;
    padding-top: 0.25rem;
    color: var(--color-muted);
    font-size: 0.72rem;
  `,
};

export default EventMissionPage;
