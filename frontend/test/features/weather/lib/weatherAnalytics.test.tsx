import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWeatherCardViewed } from '@/features/weather/lib/weatherAnalytics';
import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';

vi.mock('@/shared/lib/analytics/posthog', () => ({ trackPostHogEvent: vi.fn(() => true) }));

describe('날씨 카드 확인 기록', () => {
  beforeEach(() => vi.mocked(trackPostHogEvent).mockClear());

  it('예보가 그려질 때 마운트마다 한 번만 남긴다', () => {
    const Card = ({ shows }: { shows: boolean }) => {
      const viewedRef = useWeatherCardViewed();
      return <div>{shows && <strong ref={viewedRef}>18°</strong>}</div>;
    };
    const { rerender } = render(<Card shows={false} />, { wrapper: StrictMode });
    expect(trackPostHogEvent).not.toHaveBeenCalled();
    rerender(<Card shows />);
    rerender(<Card shows={false} />);
    rerender(<Card shows />);
    expect(trackPostHogEvent).toHaveBeenCalledTimes(1);
    expect(trackPostHogEvent).toHaveBeenCalledWith('weather_card_viewed');
  });
});
