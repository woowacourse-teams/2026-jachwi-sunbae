import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock('@/shared/lib/analytics/posthog', () => ({ trackPostHogEvent: trackEvent }));

import UsageGuidePage from '@/pages/usage-guide/UsageGuidePage';

it('사용 방법 진입을 다시 그려져도 한 번만 기록한다', () => {
  const page = (
    <MemoryRouter initialEntries={['/guide']}>
      <UsageGuidePage />
    </MemoryRouter>
  );
  const { rerender } = render(page);
  rerender(page);

  expect(trackEvent).toHaveBeenCalledExactlyOnceWith('usage_guide_viewed', {});
});
