import { Link } from 'react-router-dom';
import { useTrackingConsent } from '../app/TrackingConsentContext';
import styles from './TrackingConsentBanner.module.css';

const TrackingConsentBanner = () => {
  const { grant, deny } = useTrackingConsent();

  return (
    <aside className={styles.banner} aria-labelledby="tracking-consent-title">
      <div>
        <strong id="tracking-consent-title">광고 성과 측정에 동의하시나요?</strong>
        <p>
          Meta Pixel로 페이지 방문과 신규 시작·첫 매물 등록 여부만 측정합니다. 닉네임·비밀번호·매물 내용은 보내지
          않으며, 거부해도 모든 기능을 사용할 수 있어요. <Link to="/privacy">자세히 보기</Link>
        </p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={deny}>
          동의하지 않기
        </button>
        <button type="button" className={styles.primary} onClick={grant}>
          측정에 동의하기
        </button>
      </div>
    </aside>
  );
};

export default TrackingConsentBanner;
