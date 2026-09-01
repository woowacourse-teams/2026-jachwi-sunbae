import { type FormEvent, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, getSafeApiErrorMessage } from '../apis/apiClient';
import { submitNicknameLogin } from '../apis/authApi';
import logo from '../assets/jachwi-sunbae-logo-lockup-v3.svg';
import Icon from '../components/ui/Icon';

import { Button } from '../components/ui/Button';
import InlineNotice from '../components/ui/InlineNotice';
import TextField from '../components/ui/TextField';
import { useAuthentication } from '../hooks/useAuthentication';
import type { PublicConfig } from '../types/PublicConfig';
import { trackMetaPixelCompleteRegistration } from '../utils/metaPixel';
import { setAuthentication } from './authStore';
import styles from './LoginPage.module.css';

type LoginPageProps = {
  config: PublicConfig;
};

const getLoginErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.code === 'NICKNAME_AUTHENTICATION_FAILED') {
      return '닉네임 또는 비밀번호가 맞지 않아요.';
    }
    if (error.code === 'NICKNAME_PASSWORD_UNEXPECTED') {
      return '이미 비밀번호 없이 사용하는 닉네임이에요. 비밀번호를 비우고 다시 시작해 주세요.';
    }
    if (error.code === 'NICKNAME_AUTH_RATE_LIMITED') {
      return '비밀번호를 여러 번 확인하지 못했어요. 10분 뒤 다시 시도해 주세요.';
    }
    if (error.code === 'NICKNAME_INVALID') {
      return '닉네임은 1자 이상 30자 이하로 입력해 주세요.';
    }
    if (error.code === 'NICKNAME_PASSWORD_INVALID') {
      return '비밀번호는 4자 이상 64자 이하로 입력해 주세요.';
    }
  }
  return getSafeApiErrorMessage(error);
};

const LoginPage = ({ config }: LoginPageProps) => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const isStartingRef = useRef(false);
  const { terminationReason } = useAuthentication();
  const navigate = useNavigate();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isStartingRef.current) return;

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length === 0) {
      setStartError('이름 또는 닉네임을 입력해 주세요.');
      return;
    }
    if (password.length > 0 && password.length < 4) {
      setStartError('비밀번호는 사용하려면 4자 이상 입력해 주세요.');
      return;
    }

    isStartingRef.current = true;
    setIsStarting(true);
    setStartError(null);

    try {
      const response = await submitNicknameLogin(config, {
        nickname: trimmedNickname,
        password: password.length === 0 ? undefined : password,
      });
      setAuthentication(response);
      if (response.newMember) trackMetaPixelCompleteRegistration();
      navigate('/properties', { replace: true });
    } catch (error) {
      isStartingRef.current = false;
      setIsStarting(false);
      setStartError(getLoginErrorMessage(error));
    }
  };

  const authenticationNotice =
    terminationReason === 'expired'
      ? '로그인 시간이 지나 다시 시작해야 해요.'
      : terminationReason === 'unauthorized'
        ? '인증을 확인하지 못해 로그아웃됐어요. 다시 시작해 주세요.'
        : null;

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-heading">
        <div className={styles.heroLogo}>
          <img src={logo} alt="자취선배" />
        </div>
        <h1 id="login-heading" className="sr-only">
          자취선배 시작하기
        </h1>

        <form className={styles.actions} aria-label="닉네임으로 시작하기" onSubmit={handleLogin}>
          {authenticationNotice !== null && <InlineNotice>{authenticationNotice}</InlineNotice>}
          {startError !== null && <InlineNotice tone="error">{startError}</InlineNotice>}
          <TextField
            label="이름 또는 닉네임"
            requirement="필수"
            fieldClassName={styles.inlineField}
            autoComplete="username"
            maxLength={30}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="예: 자취초보"
            disabled={isStarting}
          />
          <TextField
            label="비밀번호"
            requirement="선택"
            fieldClassName={styles.inlineField}
            helpText="기록을 보호하려면 4자 이상 입력해 주세요."
            type="password"
            autoComplete="current-password"
            maxLength={64}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호 입력"
            disabled={isStarting}
          />
          <p className={styles.sharedWarning}>
            비밀번호를 비우면 같은 닉네임을 입력한 사람이 기록을 함께 조회하고 수정할 수 있어요.
          </p>
          <Button
            className={styles.loginButton}
            variant="primary"
            type="submit"
            fullWidth
            isLoading={isStarting}
            loadingLabel="시작하는 중…"
          >
            <Icon name="arrow-right" size={16} />
            이름으로 시작하기
          </Button>

          <p className={styles.agreement}>
            처음 쓰는 닉네임이면 새 기록 공간을 만들어요. <Link to="/privacy">개인정보·광고 측정 안내</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;
