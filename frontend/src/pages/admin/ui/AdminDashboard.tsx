import { css } from '@emotion/css';

import { type AdminSummary, describeAdminError } from '@/features/admin/api/adminApi';
import { useAdminDashboard } from '@/features/admin/api/useAdminDashboard';
import QueryState from '@/shared/ui/query-state/QueryState';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'medium' }).format(
    new Date(value),
  );

type AdminDashboardProps = { accessCode: string; summary: AdminSummary; onUnauthorized: () => void };

const AdminDashboard = ({ accessCode, summary, onUnauthorized }: AdminDashboardProps) => {
  const members = useAdminDashboard(accessCode, onUnauthorized);
  return (
    <>
      <section aria-labelledby="admin-summary-title">
        <h2 id="admin-summary-title">운영 현황</h2>
        <p>전체 계정 수는 익명 계정을 포함한 계정 수이며 실제 사람 수와 다릅니다. 오늘은 KST 기준입니다.</p>
        <dl className={styles.stats}>
          <div>
            <dt>전체 활성 계정</dt>
            <dd>{summary.activeAccounts.toLocaleString('ko-KR')}</dd>
          </div>
          <div>
            <dt>오늘 신규 계정</dt>
            <dd>{summary.newAccountsToday.toLocaleString('ko-KR')}</dd>
          </div>
          <div>
            <dt>전체 활성 매물</dt>
            <dd>{summary.activeProperties.toLocaleString('ko-KR')}</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="admin-members-title">
        <h2 id="admin-members-title">최근 가입 회원</h2>
        <p>삭제·병합 회원과 삭제된 매물·사진은 제외합니다. 최근 가입한 회원을 최대 20명 표시합니다.</p>
        <QueryState
          page={false}
          query={members}
          loadingTitle="회원 목록을 불러오는 중입니다."
          describeError={(error) => ({
            title: '회원 목록을 불러오지 못했습니다.',
            description: describeAdminError(error),
            canRetry: true,
          })}
        >
          {(data) =>
            data.length === 0 ? (
              <p>조회된 회원이 없습니다.</p>
            ) : (
              <div className={styles.tableScroll}>
                <table>
                  <caption className="sr-only">최근 가입 회원별 활성 매물과 사진 통계</caption>
                  <thead>
                    <tr>
                      <th scope="col">회원 ID</th>
                      <th scope="col">가입 시각 (KST)</th>
                      <th scope="col">활성 매물</th>
                      <th scope="col">활성 사진</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((member) => (
                      <tr key={member.memberId}>
                        <th scope="row">{member.memberId}</th>
                        <td>
                          <time dateTime={member.createdAt}>{formatDate(member.createdAt)}</time>
                        </td>
                        <td>{member.activeProperties}</td>
                        <td>{member.activePhotos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </QueryState>
      </section>
    </>
  );
};
const styles = {
  stats: css`
    label: AdminDashboard-stats;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
    & > div {
      padding: 1.5rem;
      background: #f2f5f8;
      border-radius: 12px;
    }
    & dd {
      font-size: 2rem;
      font-weight: 700;
      margin-top: 0.75rem;
    }
  `,
  tableScroll: css`
    label: AdminDashboard-tableScroll;
    max-width: 100%;
    overflow-x: auto;
    & table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      white-space: nowrap;
    }
    & th,
    & td {
      padding: 1rem;
      border-bottom: 1px solid #dfe3e8;
    }
    & thead {
      background: #f2f5f8;
    }
  `,
};
export default AdminDashboard;
