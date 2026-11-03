import type { PublicConfig } from '@/shared/config/publicConfigTypes';
import { resetPostHogIdentity, trackPostHogEvent } from '@/shared/lib/analytics/posthog';

import { clearAuthentication, getAccessToken, getAuthenticationSnapshot } from '../model/authStore';
import {
  ApiError,
  authenticate,
  captureUnexpectedApiError,
  getPendingAuthentication,
  MEMBER_PATH,
  REFRESH_PATH,
  releasePendingAuthentication,
  requestToken,
  sendAuthenticationRequest,
  sharePendingAuthentication,
  throwResponseError,
} from './apiClient';

/**
 * 지금 회원의 Access Token으로 탈퇴를 요청한다. 토큰이 만료됐거나 401을 받으면 같은 회원으로 한 번 갱신해 다시 보낸다.
 * 초기화가 진행 중인 인증으로 등록돼 있어 공용 갱신은 초기화 자신을 기다리게 되므로, 여기서는 갱신을 직접 보낸다.
 */
const requestMemberDeletion = async (config: PublicConfig): Promise<void> => {
  const { session, terminationReason } = getAuthenticationSnapshot();
  if (session === null || terminationReason !== null) throw new ApiError({ kind: 'authentication-ended' });

  const accessToken = getAccessToken() ?? (await requestToken(config, REFRESH_PATH));
  let response = await sendAuthenticationRequest(config, MEMBER_PATH, 'DELETE', accessToken);
  if (response.status === 401) {
    const refreshedToken = await requestToken(config, REFRESH_PATH);
    response = await sendAuthenticationRequest(config, MEMBER_PATH, 'DELETE', refreshedToken);
  }
  // 탈퇴가 거절되면 지금 회원은 그대로 둔다.
  if (!response.ok) await throwResponseError(response);
};

/**
 * 초기화. 지금 회원을 탈퇴 처리한 뒤, Refresh 쿠키 없이 로그인해 새 익명 회원을 받는다.
 * 진행 중인 로그인이나 갱신이 끝난 뒤에 보내고, 탈퇴가 끝날 때까지 뒤이은 로그인과 갱신은 초기화를 함께 기다린다.
 * 탈퇴가 실패하면 지금 회원과 화면 상태를 그대로 두고 오류를 던진다.
 * 탈퇴 뒤 로그인이 실패해도 세션은 이미 비었으므로, 다음 요청의 자동 로그인이 새 회원을 받는다.
 */
export const resetAuthentication = async (config: PublicConfig): Promise<void> => {
  const previous = getPendingAuthentication();
  let isMemberDeleted = false;
  let reset: Promise<string> | null = null;
  reset = sharePendingAuthentication(
    (async () => {
      if (previous !== null) await previous.catch(() => undefined);
      try {
        await requestMemberDeletion(config);
      } catch (error) {
        captureUnexpectedApiError({ error, path: MEMBER_PATH, method: 'DELETE' });
        trackPostHogEvent('account_reset_failed', {
          error_kind: error instanceof ApiError ? error.kind : 'unknown',
          error_code: error instanceof ApiError ? error.code : null,
        });
        throw error;
      }
      isMemberDeleted = true;
      // 인증을 끝내지 않고 세션과 회원 캐시만 비운다. 'unauthorized'를 넘기면 오류 화면이 뜬다.
      clearAuthentication(null);
      // 성공 이벤트는 이전 회원으로 남기고, 새 회원은 회원 조회가 끝나면 다시 식별한다.
      trackPostHogEvent('account_reset_succeeded');
      resetPostHogIdentity();
      // 탈퇴가 끝났으니 초기화 대기를 풀고, 공용 자동 로그인으로 새 회원을 받는다. 기다리던 요청은 그 토큰을 받는다.
      releasePendingAuthentication(reset);
      return authenticate(config);
    })(),
  );
  try {
    await reset;
  } catch (error) {
    if (!isMemberDeleted) throw error;
  }
};
