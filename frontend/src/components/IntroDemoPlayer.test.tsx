import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IntroDemoPlayer from './IntroDemoPlayer';

describe('공개 소개 사용 영상', () => {
  afterEach(() => vi.restoreAllMocks());

  it('세 사용 흐름을 2배속으로 자동 순환한다', () => {
    render(<IntroDemoPlayer />);

    const quickRegister = screen.getByLabelText('주소 없이 빠르게 기록 사용 예시 영상, 2배속');
    fireEvent.loadedMetadata(quickRegister);
    expect(quickRegister).toHaveProperty('playbackRate', 2);

    fireEvent.ended(quickRegister);
    const mapRegister = screen.getByLabelText('현재 위치에서 매물 등록 사용 예시 영상, 2배속');
    fireEvent.ended(mapRegister);
    const nearbyCompare = screen.getByLabelText('주변 시설과 모든 기록 비교 사용 예시 영상, 2배속');
    fireEvent.ended(nearbyCompare);

    expect(screen.getByLabelText('주소 없이 빠르게 기록 사용 예시 영상, 2배속')).toBeInTheDocument();
  });

  it('기본 자동 재생을 사용자가 멈추고 다시 시작할 수 있다', () => {
    render(<IntroDemoPlayer />);

    fireEvent.click(screen.getByRole('button', { name: '일시정지' }));
    expect(screen.getByRole('button', { name: '재생' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: '재생' }));
    expect(screen.getByRole('button', { name: '일시정지' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('순서 카드를 누르면 해당 영상으로 전환해 재생한다', () => {
    render(<IntroDemoPlayer />);

    const nearbyChapterButton = screen.getByRole('button', { name: /주변 시설과 모든 기록 비교/ });
    fireEvent.click(nearbyChapterButton);

    expect(screen.getByLabelText('주변 시설과 모든 기록 비교 사용 예시 영상, 2배속')).toBeInTheDocument();
    expect(nearbyChapterButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '일시정지' })).toBeInTheDocument();
  });

  it('동작 줄이기 환경에서는 정지 상태로 시작한다', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);

    render(<IntroDemoPlayer />);

    expect(await screen.findByRole('button', { name: '재생' })).toHaveAttribute('aria-pressed', 'true');
  });
});
