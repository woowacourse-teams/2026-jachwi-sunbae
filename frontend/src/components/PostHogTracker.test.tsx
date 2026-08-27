import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicConfig } from '../types/PublicConfig';
import * as posthogModule from '../utils/posthog';
import PostHogTracker from './PostHogTracker';

const testConfig: PublicConfig = {
  apiBaseUrl: 'http://localhost:8080',
  mapProviderMode: 'demo',
  kakaoMapJavaScriptKey: '',
  metaPixelId: '',
  posthogProjectToken: 'phc_test_token',
  posthogHost: 'https://us.i.posthog.com',
};

describe('PostHogTracker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('토큰과 호스트가 주어지면 초기화하고 현재 경로를 추적한다', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const initSpy = vi.spyOn(posthogModule, 'initPostHog');
    const trackSpy = vi.spyOn(posthogModule, 'trackPostHogPageView');

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/properties?page=1']}>
          <PostHogTracker config={testConfig} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(initSpy).toHaveBeenCalledWith('phc_test_token', 'https://us.i.posthog.com');
    expect(trackSpy).toHaveBeenCalledWith('/properties?page=1');
  });
});
