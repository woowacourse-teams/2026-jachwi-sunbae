import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePropertyCreationForm } from '@/pages/create-property/hooks/usePropertyCreationForm';
import { DEFAULT_PROPERTY_NAME, toQuickPropertyInput } from '@/features/property/lib/propertyForm';

const { trackEvent, useCreate, setInitialQuery } = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  useCreate: vi.fn(() => ({ isPending: false })),
  setInitialQuery: vi.fn(),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/shared/lib/analytics/posthog', () => ({ trackPostHogEvent: trackEvent }));
vi.mock('@/features/property/api/usePropertyMutations', () => ({ useCreateProperty: useCreate }));
vi.mock('@/pages/create-property/hooks/usePropertyLocation', () => ({
  default: () => ({ locationStatus: 'idle', selectedLocation: {} }),
}));
vi.mock('@/pages/create-property/hooks/useAddressSearch', () => ({ default: () => ({ setInitialQuery }) }));
describe('등록 진입 경로 지표', () => {
  afterEach(() => vi.clearAllMocks());
  it('공개 탐색에서 넘어온 동네는 주소 선택의 시작점이지 확정된 매물 위치가 아니다', () => {
    const { result } = renderHook(() =>
      usePropertyCreationForm({
        fromExploration: true,
        selectedLocation: {
          latitude: 37.4,
          longitude: 127.1,
          address: '테스트 동네',
          roadAddress: null,
          jibunAddress: null,
        },
      }),
    );
    expect(result.current.hasPresetLocation).toBe(false);
  });
  it.each(['form', 'map'] as const)('%s 진입은 StrictMode에서도 시작을 한 번 기록한다', (entrypoint) => {
    const wrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;
    const routeState =
      entrypoint === 'map'
        ? {
            selectedLocation: {
              latitude: 37,
              longitude: 127,
              address: '테스트 위치',
              roadAddress: null,
              jibunAddress: null,
            },
          }
        : {};
    renderHook(() => usePropertyCreationForm(routeState), { wrapper });
    expect(trackEvent.mock.calls).toEqual([['property_creation_started', { entrypoint }]]);
    expect(useCreate).toHaveBeenCalledWith(entrypoint);
  });
});

describe('위치만으로 만드는 매물 요청', () => {
  it('이름은 새 매물, 금액은 0으로 두고 주소와 좌표만 채운다', () => {
    expect(
      toQuickPropertyInput({
        roadAddress: '서울 관악구 신림로 12길 3',
        jibunAddress: null,
        address: null,
        latitude: 37.48,
        longitude: 126.93,
      }),
    ).toMatchObject({
      name: DEFAULT_PROPERTY_NAME,
      depositAmount: 0,
      monthlyRentAmount: 0,
      address: '서울 관악구 신림로 12길 3',
      latitude: 37.48,
      longitude: 126.93,
    });
  });
});
