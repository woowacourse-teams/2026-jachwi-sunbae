import { css } from '@emotion/css';
import { useRef, useState } from 'react';

import { describeAdminError } from '@/features/admin/api/adminApi';
import { Button } from '@/shared/ui/button/Button';

type AdminLoginProps = { login: (code: string) => Promise<void>; isChanging: boolean; error: unknown };

const AdminLogin = ({ login, isChanging, error }: AdminLoginProps) => {
  const [code, setCode] = useState('');
  const input = useRef<HTMLInputElement>(null);
  return (
    <section className={styles.card} aria-labelledby="admin-login-title">
      <h2 id="admin-login-title">관리자 접속</h2>
      <p>운영 담당자에게 전달받은 접속 코드를 입력해 주세요.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (isChanging || code.length === 0) return;
          const submitted = code.trim();
          setCode('');
          void login(submitted).finally(() => input.current?.focus());
        }}
      >
        <label htmlFor="admin-access-code">접속 코드</label>
        <input
          id="admin-access-code"
          ref={input}
          type="password"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
          className="ph-no-capture ph-sensitive"
        />
        {error !== null && <p role="alert">{describeAdminError(error)}</p>}
        <Button type="submit" isLoading={isChanging} fullWidth>
          접속하기
        </Button>
      </form>
      <p>일반 회원 계정과 별도로 접속합니다. 새로고침하면 코드를 다시 입력해 주세요.</p>
    </section>
  );
};
const styles = {
  card: css`
    label: AdminLogin-card;
    max-width: 30rem;
    margin: 3rem auto;
    padding: 2rem;
    border: 1px solid var(--color-border, #dfe3e8);
    border-radius: 16px;
    background: var(--color-surface, #fff);
    & h2 {
      margin-bottom: 1rem;
    }
    & p {
      margin: 1rem 0;
      line-height: 1.6;
    }
    & form {
      display: grid;
      gap: 0.75rem;
    }
    & input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #738091;
      border-radius: 8px;
    }
    & [role='alert'] {
      color: #a62121;
    }
  `,
};
export default AdminLogin;
