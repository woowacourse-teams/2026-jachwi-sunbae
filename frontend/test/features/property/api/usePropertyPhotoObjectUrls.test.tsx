import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';

import { setAuthentication } from '@/features/auth/model/authStore';
import { usePropertyPhotoObjectUrls } from '@/features/property/api/usePropertyPhotoObjectUrls';
import type { PropertySummary } from '@/features/property/model/Property';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';
import type { PublicConfig } from '@/shared/config/publicConfigTypes';

import { server } from '../../../server';

const config: PublicConfig = { apiBaseUrl: 'http://localhost:8080' };

const propertyWithPhoto = (propertyId: number, photoId: number): PropertySummary => ({
  propertyId,
  name: `매물 ${propertyId}`,
  depositAmount: 10_000_000,
  monthlyRentAmount: 500_000,
  discoverySource: { type: 'TEXT', value: '테스트' },
  location: { address: '서울', latitude: 37.5665, longitude: 126.978 },
  representativePhoto: {
    photoId,
    contentUrl: `/api/properties/${propertyId}/photos/${photoId}`,
    contentType: 'image/jpeg',
  },
  progress: {
    totalCount: 0,
    completedCount: 0,
    goodCount: 0,
    cautionCount: 0,
    unconfirmedCount: 0,
    progressRate: 0,
  },
  stages: [],
  photoCount: 1,
});

describe('지도 매물 사진 Object URL', () => {
  it('다른 사진이 추가로 도착해도 이미 만든 URL을 다시 생성하지 않는다', async () => {
    setAuthentication({ accessToken: 'photo-token', tokenType: 'Bearer', expiresIn: 60 });
    const first = propertyWithPhoto(10, 81);
    const second = propertyWithPhoto(11, 82);
    server.use(
      http.get(
        `${config.apiBaseUrl}/api/properties/10/photos/81`,
        () => new HttpResponse(new Uint8Array([1]), { headers: { 'Content-Type': 'image/jpeg' } }),
      ),
      http.get(
        `${config.apiBaseUrl}/api/properties/11/photos/82`,
        () => new HttpResponse(new Uint8Array([2]), { headers: { 'Content-Type': 'image/jpeg' } }),
      ),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => (
      <PublicConfigProvider config={config}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </PublicConfigProvider>
    );

    const rendered = renderHook(
      ({ properties }: { properties: PropertySummary[] }) => usePropertyPhotoObjectUrls(properties),
      { initialProps: { properties: [first] }, wrapper },
    );

    await waitFor(() => expect(rendered.result.current[10]).toMatch(/^blob:test-photo-/));
    const firstUrl = rendered.result.current[10];
    expect(URL.createObjectURL).toHaveBeenCalledOnce();

    rendered.rerender({ properties: [first, second] });

    await waitFor(() => expect(rendered.result.current[11]).toMatch(/^blob:test-photo-/));
    expect(rendered.result.current[10]).toBe(firstUrl);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    rendered.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
