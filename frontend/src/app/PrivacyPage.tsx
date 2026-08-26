import TopNavigation from '../components/ui/TopNavigation';
import { useTrackingConsent } from './TrackingConsentContext';
import styles from './PrivacyPage.module.css';

const PrivacyPage = () => {
  const { available, status, grant, deny } = useTrackingConsent();
  const statusLabel = !available
    ? '이 환경에서는 측정하지 않음'
    : status === 'granted'
      ? '동의함'
      : status === 'denied'
        ? '동의하지 않음'
        : '아직 선택하지 않음';

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <TopNavigation title="개인정보·광고 측정 안내" backTo="/intro" backLabel="소개 화면으로 돌아가기" />
        <section className={styles.section} aria-labelledby="tracking-purpose-heading">
          <p className={styles.eyebrow}>Meta Pixel</p>
          <h1 id="tracking-purpose-heading">광고가 실제 사용으로 이어지는지 확인합니다.</h1>
          <p>
            사용자가 동의한 경우에만 Meta Pixel을 불러오고, 페이지 방문과 신규 닉네임 생성·첫 매물 등록 이벤트를 Meta에
            전송합니다. 광고 성과를 측정하고 다음 광고의 노출 대상을 개선하기 위한 목적입니다.
          </p>
        </section>

        <section className={styles.card} aria-labelledby="tracking-data-heading">
          <h2 id="tracking-data-heading">전송하는 정보</h2>
          <ul>
            <li>방문한 서비스 경로와 방문 시각</li>
            <li>신규 닉네임 생성 여부와 첫 매물 등록 여부</li>
            <li>Meta가 브라우저에서 처리하는 쿠키·기기·브라우저 정보</li>
          </ul>
          <p className={styles.strongNotice}>닉네임, 비밀번호, 주소, 사진, 메모와 체크 내용은 전송하지 않습니다.</p>
        </section>

        <section className={styles.card} aria-labelledby="tracking-choice-heading">
          <h2 id="tracking-choice-heading">선택과 철회</h2>
          <p>
            동의하지 않아도 자취선배의 모든 기능을 사용할 수 있습니다. 아래 선택은 이 브라우저에 저장되며 언제든 바꿀 수
            있습니다. 철회하면 이후 측정을 중단합니다.
          </p>
          <p className={styles.status} role="status">
            현재 상태: {statusLabel}
          </p>
          {available ? (
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={deny}>
                동의하지 않기
              </button>
              <button type="button" className={styles.primary} onClick={grant}>
                측정에 동의하기
              </button>
            </div>
          ) : null}
        </section>

        <p className={styles.externalNotice}>
          Meta의 데이터 처리 방식은{' '}
          <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noreferrer">
            Meta 개인정보처리방침
          </a>
          에서 확인할 수 있습니다.
        </p>
      </div>
    </main>
  );
};

export default PrivacyPage;
