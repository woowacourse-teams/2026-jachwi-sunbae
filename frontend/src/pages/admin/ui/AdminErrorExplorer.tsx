import { css } from '@emotion/css';
import { useState } from 'react';

import type { AdminLogSearch } from '@/features/admin/api/adminLogsApi';

import AdminLogs from './AdminLogs';
import AdminPostHog from './AdminPostHog';

type AdminErrorExplorerProps = { accessCode: string; onUnauthorized: () => void };
const AdminErrorExplorer = ({ accessCode, onUnauthorized }: AdminErrorExplorerProps) => {
  const [tab, setTab] = useState<'cloudwatch' | 'posthog'>('cloudwatch');
  const [serverSearch, setServerSearch] = useState<AdminLogSearch | null>(null);
  return (
    <>
      <nav className={styles.tabs} aria-label="오류 조회 소스">
        <button
          type="button"
          aria-pressed={tab === 'cloudwatch'}
          onClick={() => {
            if (tab !== 'cloudwatch') setServerSearch(null);
            setTab('cloudwatch');
          }}
        >
          CloudWatch — 서버 로그
        </button>
        <button type="button" aria-pressed={tab === 'posthog'} onClick={() => setTab('posthog')}>
          PostHog — 프론트엔드 오류
        </button>
      </nav>
      {tab === 'cloudwatch' ? (
        <AdminLogs accessCode={accessCode} onUnauthorized={onUnauthorized} initialSearch={serverSearch} />
      ) : (
        <AdminPostHog
          accessCode={accessCode}
          onUnauthorized={onUnauthorized}
          onOpenServerLogs={(search) => {
            setServerSearch(search);
            setTab('cloudwatch');
          }}
        />
      )}
    </>
  );
};
const styles = {
  tabs: css`
    label: AdminErrorExplorer-tabs;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 1.5rem;
    & button {
      padding: 0.85rem 1rem;
      background: #1b222c;
      color: #b6c2d1;
      border: 1px solid #343f4e;
      border-radius: 5px;
    }
    & button[aria-pressed='true'] {
      color: #fff;
      border-bottom: 3px solid #ff9830;
    }
    & button:focus-visible {
      outline: 2px solid #4b94db;
      outline-offset: 3px;
    }
  `,
};
export default AdminErrorExplorer;
