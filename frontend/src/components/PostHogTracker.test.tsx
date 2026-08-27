import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as posthogModule from '../utils/posthog';
import PostHogTracker from './PostHogTracker';

describe('PostHogTracker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('토큰과 호스트가 주어지면 초기화하고 현재 경로를 추적한다', () => {
    const initSpy = vi.spyOn(posthogModule, 'initPostHog');
    const trackSpy = vi.spyOn(posthogModule, 'trackPostHogPageView');

    render(
      <MemoryRouter initialEntries={['/properties?page=1']}>
        <PostHogTracker projectToken="phc_test_token" host="https://us.i.posthog.com" />
      </MemoryRouter>,
    );

    expect(initSpy).toHaveBeenCalledWith('phc_test_token', 'https://us.i.posthog.com');
    expect(trackSpy).toHaveBeenCalledWith('/properties?page=1');
  });
});
