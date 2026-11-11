import { css } from '@emotion/css';

import { useAdminAccess } from '@/features/admin/api/useAdminAccess';
import useDocumentTitle from '@/shared/lib/hooks/useDocumentTitle';
import { Button } from '@/shared/ui/button/Button';

import AdminDashboard from './ui/AdminDashboard';
import AdminLogin from './ui/AdminLogin';

const AdminPage = () => {
  useDocumentTitle('운영 관리자');
  const auth = useAdminAccess();
  return (
    <main className={styles.page + ' ph-no-capture ph-sensitive'}>
      <header className={styles.header}>
        <div>
          <p>자취선배 · 읽기 전용 운영 도구</p>
          <h1>운영 관리자</h1>
        </div>
        {auth.access !== null && (
          <Button variant="neutral" onClick={auth.logout}>
            관리자 로그아웃
          </Button>
        )}
      </header>
      {auth.access === null ? (
        <AdminLogin login={auth.login} isChanging={auth.isChanging} error={auth.error} />
      ) : (
        <>
          <AdminDashboard accessCode={auth.access.code} summary={auth.access.summary} onUnauthorized={auth.logout} />
          <section aria-labelledby="admin-monitoring-title">
            <h2 id="admin-monitoring-title">운영 모니터링</h2>
            <p>각 서비스의 별도 운영 권한이 필요합니다. PostHog 오류의 request_id로 CloudWatch 로그를 검색하세요.</p>
            <ul>
              <li>
                <a
                  href="https://ap-northeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#dashboards/dashboard/jachwi-sunbae-operations"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CloudWatch 운영 대시보드 ↗
                </a>
              </li>
              <li>
                <a href="https://us.posthog.com/project/579863" target="_blank" rel="noopener noreferrer">
                  PostHog 오류 추적 ↗
                </a>
              </li>
            </ul>
          </section>
        </>
      )}
    </main>
  );
};
const styles = {
  page: css`
    label: AdminPage-page;
    max-width: 72rem;
    margin: 0 auto;
    padding: clamp(1rem, 4vw, 3rem);
    color: #1c2939;
    & h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0.5rem 0;
    }
    & h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    & section {
      margin-top: 2rem;
    }
    & p {
      line-height: 1.6;
    }
    & a {
      color: #164b86;
      text-decoration: underline;
    }
    & ul {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      padding: 1rem 0;
    }
    & [role='alert'] {
      color: #a62121;
    }
  `,
  header: css`
    label: AdminPage-header;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid #dfe3e8;
  `,
};
export default AdminPage;
