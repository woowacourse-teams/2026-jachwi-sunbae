import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { propertySummaryFixture } from '@/app/mocks/fixtures/propertyFixtures';
import ComparePropertyPreview from '@/pages/property-compare/ui/compare-property-preview/ComparePropertyPreview';
import type { PropertySummary } from '@/features/property/model/Property';

const detail = vi.hoisted(() => ({ isPending: true }));
vi.mock('@/features/property/api/useProperties', () => ({
  usePropertyDetail: () => ({ data: undefined, isPending: detail.isPending, isError: false }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-22T00:00:00.000Z'));
  detail.isPending = true;
});
afterEach(() => {
  vi.useRealTimers();
});

const property: PropertySummary = {
  ...propertySummaryFixture,
  discoverySource: { type: 'URL', value: '' },
  representativePhoto: null,
};

it('목록 요약은 먼저 보이고, 300ms 안에 온 상세에는 불러오는 중 문구를 띄우지 않는다', () => {
  const { rerender } = render(<ComparePropertyPreview property={property} />);
  expect(screen.getByRole('heading', { name: property.name })).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(299));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  detail.isPending = false;
  rerender(<ComparePropertyPreview property={property} />);
  act(() => vi.runOnlyPendingTimers());
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('상세가 300ms를 넘기면 불러오는 중 문구를 띄우고 250ms는 유지한다', () => {
  const { rerender } = render(<ComparePropertyPreview property={property} />);
  act(() => vi.advanceTimersByTime(300));
  expect(screen.getByRole('status')).toHaveTextContent('상세 정보를 불러오고 있어요.');

  detail.isPending = false;
  rerender(<ComparePropertyPreview property={property} />);
  act(() => vi.advanceTimersByTime(249));
  expect(screen.getByRole('status')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
