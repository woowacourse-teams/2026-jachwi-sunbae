import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { resetMetaPixelForTests } from '../utils/metaPixel';
import { TrackingConsentProvider } from './TrackingConsentContext';

describe('광고 측정 동의', () => {
  afterEach(() => resetMetaPixelForTests());

  it('결정 전에는 고지를 표시하고 거부하면 스크립트를 불러오지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/intro']}>
        <TrackingConsentProvider metaPixelId="1591771152645660">
          <main>소개 화면</main>
        </TrackingConsentProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('광고 성과 측정에 동의하시나요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '동의하지 않기' }));

    expect(screen.queryByText('광고 성과 측정에 동의하시나요?')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('jachwi-sunbae:meta-tracking-consent')).toBe('denied');
    expect(document.getElementById('meta-pixel-script')).toBeNull();
  });

  it('동의하면 스크립트를 초기화하고 현재 경로 PageView를 한 번 기록한다', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/intro']}>
        <TrackingConsentProvider metaPixelId="1591771152645660">
          <main>소개 화면</main>
        </TrackingConsentProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '측정에 동의하기' }));

    expect(window.localStorage.getItem('jachwi-sunbae:meta-tracking-consent')).toBe('granted');
    expect(document.getElementById('meta-pixel-script')).toBeInTheDocument();
  });
});
