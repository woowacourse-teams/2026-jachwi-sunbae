import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ButtonHTMLAttributes, StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LogClick, LogImpression, LogParamsProvider, LogScreen, withLogClick } from '@/shared/lib/analytics/logging';
import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';

vi.mock('@/shared/lib/analytics/posthog', () => ({ trackPostHogEvent: vi.fn(() => true) }));

const PlainButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" {...props} />;
const LoggedButton = withLogClick(PlainButton);

describe('선언적 로깅 컴포넌트', () => {
  beforeEach(() => {
    vi.mocked(trackPostHogEvent).mockClear();
  });

  it('LogScreen은 마운트 시 한 번만 화면 이벤트를 보낸다', () => {
    const { rerender } = render(
      <LogScreen event="home_viewed" params={{ screen: 'home' }}>
        <p>홈</p>
      </LogScreen>,
    );
    rerender(
      <LogScreen event="home_viewed" params={{ screen: 'home' }}>
        <p>홈</p>
      </LogScreen>,
    );
    expect(trackPostHogEvent).toHaveBeenCalledTimes(1);
    expect(trackPostHogEvent).toHaveBeenCalledWith('home_viewed', { screen: 'home' });
  });

  it('LogScreen은 StrictMode의 effect 중복 실행을 기록하지 않는다', () => {
    render(
      <StrictMode>
        <LogScreen event="home_viewed">
          <p>홈</p>
        </LogScreen>
      </StrictMode>,
    );
    expect(trackPostHogEvent).toHaveBeenCalledTimes(1);
  });

  it('LogImpression은 보인 항목마다 한 번만 노출을 보내고, 새로 보인 항목만 더 보낸다', () => {
    type Memo = { id: number; text: string };
    const getKey = (memo: Memo) => memo.id;
    const getParams = (memo: Memo) => ({ memo_id: memo.id, memo: memo.text });
    const first = [
      { id: 1, text: '골목이 밝아요' },
      { id: 2, text: '밤에 시끄러워요' },
    ];
    const { rerender } = render(
      <LogImpression event="memo_impressed_test" items={first} getKey={getKey} getParams={getParams} />,
    );
    expect(trackPostHogEvent).toHaveBeenCalledTimes(2);
    // 지도를 옮겨 같은 메모와 새 메모가 함께 보이면 새 메모만 남긴다.
    rerender(
      <LogImpression
        event="memo_impressed_test"
        items={[...first, { id: 3, text: '편의점이 가까워요' }]}
        getKey={getKey}
        getParams={getParams}
      />,
    );
    expect(trackPostHogEvent).toHaveBeenCalledTimes(3);
    expect(trackPostHogEvent).toHaveBeenLastCalledWith('memo_impressed_test', {
      memo_id: 3,
      memo: '편의점이 가까워요',
    });
  });

  it('LogClick은 상위 속성을 합쳐 로그를 보낸 뒤 원래 onClick을 실행한다', async () => {
    const onClick = vi.fn();
    render(
      <LogScreen event="home_viewed" params={{ screen: 'home' }}>
        <LogParamsProvider params={{ section: 'banner' }}>
          <LogClick event="banner_clicked" params={{ section: 'hero' }}>
            <button type="button" onClick={onClick}>
              배너
            </button>
          </LogClick>
        </LogParamsProvider>
      </LogScreen>,
    );
    await userEvent.click(screen.getByRole('button', { name: '배너' }));
    expect(trackPostHogEvent).toHaveBeenLastCalledWith('banner_clicked', { screen: 'home', section: 'hero' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('withLogClick은 로그 prop을 원본에 넘기지 않고, logEvent가 없으면 로그를 보내지 않는다', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <LoggedButton logEvent="save_clicked" logParams={{ target: 'property' }} onClick={onClick}>
        저장
      </LoggedButton>,
    );
    const button = screen.getByRole('button', { name: '저장' });
    expect(button).not.toHaveAttribute('logEvent');
    await userEvent.click(button);
    expect(trackPostHogEvent).toHaveBeenCalledWith('save_clicked', { target: 'property' });

    rerender(<LoggedButton onClick={onClick}>저장</LoggedButton>);
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(trackPostHogEvent).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
