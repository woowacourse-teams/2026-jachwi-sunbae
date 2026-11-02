import { render, screen } from '@testing-library/react';
import { lazy } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';

import LazyRouteBoundary from '@/app/router/LazyRouteBoundary';
import RecordsPageSkeleton from '@/pages/design-records/RecordsPageSkeleton';

const PendingPage = lazy(() => new Promise<{ default: () => null }>(() => undefined));

const renderPending = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LazyRouteBoundary fallback={<RecordsPageSkeleton />}>
        <PendingPage />
      </LazyRouteBoundary>
    </MemoryRouter>,
  );

const useDesktopViewport = () =>
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: query === '(min-width: 1024px)',
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

it('기록 화면 코드를 받는 동안 진행 표시 대신 헤더와 리스트 뼈대를 바로 보여 준다', () => {
  renderPending('/properties?view=list');
  expect(screen.getByRole('status')).toHaveTextContent('기록을 불러오는 중이에요.');
  expect(screen.getByRole('navigation', { name: '기록 보기 방식' })).toBeInTheDocument();
  expect(screen.getByRole('list', { hidden: true })).toBeInTheDocument();
  expect(screen.queryByTestId('record-map-skeleton')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

it('휴대폰 지도 보기로 열면 리스트 뼈대 대신 지도 영역 뼈대를 보여 준다', () => {
  renderPending('/properties?view=map');
  expect(screen.getByRole('status')).toHaveTextContent('기록을 불러오는 중이에요.');
  expect(screen.getByTestId('record-map-skeleton')).toBeInTheDocument();
  expect(screen.queryByRole('list', { hidden: true })).not.toBeInTheDocument();
});

it('주소에 보기 방식이 없으면 마지막으로 고른 보기의 뼈대를 보여 준다', () => {
  sessionStorage.setItem('jachwi:records-view', 'list');
  renderPending('/properties');
  expect(screen.queryByTestId('record-map-skeleton')).not.toBeInTheDocument();
  expect(screen.getByRole('list', { hidden: true })).toBeInTheDocument();
});

it('데스크탑은 실제 화면처럼 왼쪽 리스트 뼈대와 오른쪽 지도 뼈대를 함께 두고 불러오는 중은 한 번만 알린다', () => {
  useDesktopViewport();
  renderPending('/properties?view=list');
  expect(screen.getByRole('status')).toHaveTextContent('기록을 불러오는 중이에요.');
  expect(screen.getByRole('list', { hidden: true })).toBeInTheDocument();
  expect(screen.getByTestId('record-map-skeleton')).toHaveAttribute('aria-hidden', 'true');
});
