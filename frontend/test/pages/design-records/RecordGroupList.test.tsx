import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RecordsState } from '@/pages/design-records/hooks/useRecords';
import RecordGroupList from '@/pages/design-records/ui/record-group/RecordGroupList';

vi.mock('@/features/property/ui/property-card/PropertyCard', () => ({ default: () => <div>매물 카드</div> }));
vi.mock('@/pages/design-records/ui/record-list/RecordCardMenu', () => ({ default: () => null }));

const record = (id: string) => ({ id, name: `매물 ${id}`, summary: {} }) as unknown as RecordsState['records'][number];

describe('RecordGroupList', () => {
  it('목록 칸 폭을 시트 폭에 묶어 긴 매물 이름이 카드를 시트 밖으로 밀어내지 않는다', () => {
    render(<RecordGroupList records={[record('1'), record('2')]} onNotice={() => undefined} />);
    const list = screen.getByRole('list');
    expect(screen.getAllByText('매물 카드')).toHaveLength(2);
    // 기본(auto) 칸은 자식의 최소 폭(한 줄로 둔 이름 전체)까지 넓어진다. 0까지 줄어들 수 있어야 시트 폭을 넘지 않는다.
    expect(getComputedStyle(list).gridTemplateColumns).toBe('minmax(0, 1fr)');
  });
});
