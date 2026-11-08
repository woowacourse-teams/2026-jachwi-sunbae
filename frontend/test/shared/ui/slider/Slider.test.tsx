import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import Slider from '@/shared/ui/slider/Slider';

const renderSlider = () => {
  const onValuesChange = vi.fn();
  const onValuesCommit = vi.fn();
  render(
    <Slider
      min={0}
      max={4}
      values={[0]}
      onValuesChange={onValuesChange}
      onValuesCommit={onValuesCommit}
      getAriaLabel={() => '값'}
    />,
  );
  return { slider: screen.getByRole('slider', { name: '값' }), onValuesChange, onValuesCommit };
};

it('끄는 동안에는 값만 알리고 손을 떼면 마지막 값을 한 번 정한다', () => {
  const { slider, onValuesChange, onValuesCommit } = renderSlider();
  fireEvent.pointerDown(slider);
  fireEvent.change(slider, { target: { value: '2' } });
  fireEvent.change(slider, { target: { value: '3' } });
  expect(onValuesChange).toHaveBeenLastCalledWith([3]);
  expect(onValuesCommit).not.toHaveBeenCalled();
  // 막대 밖에서 손을 떼도 정한다.
  fireEvent.pointerUp(window);
  expect(onValuesCommit).toHaveBeenCalledWith([3]);
  fireEvent.pointerUp(window);
  expect(onValuesCommit).toHaveBeenCalledOnce();
});

it('끌기가 취소돼도 값을 정하고, 키보드로 바꾸면 바로 정한다', () => {
  const { slider, onValuesCommit } = renderSlider();
  fireEvent.pointerDown(slider);
  fireEvent.pointerCancel(window);
  expect(onValuesCommit).toHaveBeenCalledWith([0]);
  fireEvent.change(slider, { target: { value: '1' } });
  expect(onValuesCommit).toHaveBeenLastCalledWith([1]);
});
