import { runPostHogAction } from './client';
import type { PostHogSessionContext } from './types';
let sessionContext: PostHogSessionContext | null = null;
let identifiedMember: string | null = null;
export const setPostHogSessionContext = (context: PostHogSessionContext): boolean => {
  if (context.app_version.trim().length === 0) return false;
  sessionContext = { ...context };
  return runPostHogAction((client) => client.register(context));
};
export const identifyPostHogMember = (memberId: number, nickname?: string): boolean => {
  if (!Number.isInteger(memberId) || memberId <= 0) return false;
  const distinctId = `member-${memberId}`;
  const identityKey = JSON.stringify([distinctId, nickname]);
  return runPostHogAction((client) => {
    if (identifiedMember === identityKey) return;
    client.identify(distinctId, nickname === undefined ? undefined : { name: nickname, nickname });
    identifiedMember = identityKey;
  });
};
export const resetPostHogIdentity = (): void => {
  runPostHogAction((client) => {
    // 첫 익명 방문에는 reset하지 않아 방문·리플레이의 익명 ID를 유지한다.
    if (identifiedMember === null && !client.get_property('$user_id')) return;
    client.reset();
    identifiedMember = null;
    if (sessionContext !== null) client.register(sessionContext);
  });
};
export const resetPostHogSessionState = (): void => {
  sessionContext = null;
  identifiedMember = null;
};
