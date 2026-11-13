import type { PostHogConfig } from 'posthog-js';
import { describe, expect, it } from 'vitest';

import { isAdminPath } from '@/shared/lib/analytics/adminPrivacy';
import { getPostHogOptions } from '@/shared/lib/analytics/posthog/configuration';

describe('관리자 수집 제외', () => {
  it('관리자 경계만 인식하고 일반 화면은 유지한다', () => {
    expect(isAdminPath('/admin')).toBe(true);
    expect(isAdminPath('/admin/members?code=never-collect')).toBe(true);
    expect(isAdminPath('/administrator')).toBe(false);
  });

  it('관리자 화면의 자동 이벤트·오류·녹화는 전송 전에 버린다', () => {
    const beforeSend = getPostHogOptions('https://us.i.posthog.com', () => null).before_send as Exclude<
      PostHogConfig['before_send'],
      unknown[] | undefined
    >;
    window.history.replaceState(null, '', '/admin');
    for (const event of ['$autocapture', '$exception', '$snapshot', '$pageview']) {
      expect(beforeSend({ event, properties: { accessCode: 'never-collect' } } as never)).toBeNull();
    }
    window.history.replaceState(null, '', '/');
    expect(beforeSend({ event: 'normal_event', properties: {} } as never)).not.toBeNull();
  });

  it('관리자 API 요청은 세션 녹화의 네트워크 기록에서 제외한다', () => {
    const options = getPostHogOptions('https://us.i.posthog.com', () => null);
    const mask = options.session_recording?.maskCapturedNetworkRequestFn;
    expect(mask?.({ name: 'https://api.example.com/api/admin/session' } as never)).toBeNull();
    expect(mask?.({ name: 'https://api.example.com/api/properties' } as never)).not.toBeNull();
  });
});
