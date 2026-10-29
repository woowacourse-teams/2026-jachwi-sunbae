import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import BottomSheet from '@/shared/ui/bottom-sheet/BottomSheet';

const renderSheet = (props: Partial<Parameters<typeof BottomSheet>[0]> = {}) => {
  const onClose = vi.fn();
  const view = render(
    <BottomSheet title="역삼1동" onClose={onClose} showCloseButton={false} fullPage {...props}>
      <p>내용</p>
    </BottomSheet>,
  );
  return { onClose, view, sheet: () => screen.getByRole('region', { name: '역삼1동' }) };
};

it('손잡이를 누르기만 해서는 높이를 바꾸지 않고, 위·아래 화살표로 한 단계씩 바꾼다', async () => {
  const user = userEvent.setup();
  const { sheet } = renderSheet();
  const handle = screen.getByRole('button', { name: '상세 패널 높이 조절' });
  await user.click(handle);
  expect(sheet()).toHaveAttribute('data-mode', 'default');
  handle.focus();
  await user.keyboard('{ArrowUp}');
  expect(sheet()).toHaveAttribute('data-mode', 'expanded');
  await user.keyboard('{ArrowDown}{ArrowDown}');
  expect(sheet()).toHaveAttribute('data-mode', 'peek');
});

it('끝까지 올리면 손잡이 없이 헤더에 뒤로가기·닫기가 있는 페이지가 되고, 뒤로가기로 시트에 돌아온다', async () => {
  const user = userEvent.setup();
  const { sheet, onClose } = renderSheet();
  expect(screen.queryByRole('button', { name: '뒤로 가기' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '상세 닫기' })).not.toBeInTheDocument();
  screen.getByRole('button', { name: '상세 패널 높이 조절' }).focus();
  await user.keyboard('{ArrowUp}{ArrowUp}');
  expect(sheet()).toHaveAttribute('data-mode', 'full');
  expect(screen.queryByRole('button', { name: '상세 패널 높이 조절' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '뒤로 가기' }));
  expect(sheet()).toHaveAttribute('data-mode', 'default');
  screen.getByRole('button', { name: '상세 패널 높이 조절' }).focus();
  await user.keyboard('{ArrowUp}{ArrowUp}');
  await user.click(screen.getByRole('button', { name: '상세 닫기' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('fullPage가 아니면 끝까지 올려도 페이지로 바꾸지 않는다', async () => {
  const user = userEvent.setup();
  const { sheet } = renderSheet({ fullPage: false });
  screen.getByRole('button', { name: '상세 패널 높이 조절' }).focus();
  await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
  expect(sheet()).toHaveAttribute('data-mode', 'expanded');
});

it('onBack을 주면 시트 높이와 상관없이 제목 왼쪽에 뒤로가기를 둔다', async () => {
  const user = userEvent.setup();
  const onBack = vi.fn();
  renderSheet({ onBack });
  await user.click(screen.getByRole('button', { name: '뒤로 가기' }));
  expect(onBack).toHaveBeenCalledTimes(1);
});

it('peekSignal이 바뀌면 제목만 보이게 내리고, 처음 렌더링에서는 내리지 않는다', () => {
  const { sheet, view } = renderSheet({ peekSignal: 0 });
  expect(sheet()).toHaveAttribute('data-mode', 'default');
  view.rerender(
    <BottomSheet title="역삼1동" onClose={() => undefined} showCloseButton={false} fullPage peekSignal={1}>
      <p>내용</p>
    </BottomSheet>,
  );
  expect(sheet()).toHaveAttribute('data-mode', 'peek');
});

it('headerEnd는 제목 오른쪽 끝에 두고, 페이지로 열려 닫기가 생기면 그 왼쪽에 둔다', async () => {
  const user = userEvent.setup();
  renderSheet({ headerEnd: <a href="https://example.com">외부 링크</a> });
  const header = screen.getByRole('heading', { name: '역삼1동' }).closest('header')!;
  expect(header.lastElementChild).toHaveTextContent('외부 링크');
  screen.getByRole('button', { name: '상세 패널 높이 조절' }).focus();
  await user.keyboard('{ArrowUp}{ArrowUp}');
  const buttons = [...header.children].map((child) => child.textContent || child.getAttribute('aria-label'));
  expect(buttons.indexOf('외부 링크')).toBeLessThan(buttons.indexOf('상세 닫기'));
});

it('subtitle은 제목 아래 작은 한 줄로 둔다', () => {
  renderSheet({ subtitle: '서울특별시 강남구 역삼1동' });
  const titles = screen.getByRole('heading', { name: '역삼1동' }).parentElement!;
  expect(titles).toHaveTextContent('서울특별시 강남구 역삼1동');
});
