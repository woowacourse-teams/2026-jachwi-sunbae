import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { propertyHandlers } from '@/app/mocks/handlers/propertyHandlers';
import { resetMockStore } from '@/app/mocks/mockStore';
import { resetAuthenticationForTests, setAuthentication } from '@/features/auth/model/authStore';
import PropertyPhotoViewer from '@/features/property/ui/property-photo-viewer/PropertyPhotoViewer';
import { queryClient } from '@/shared/api/queryClient';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';

import { server } from '../../../server';

beforeEach(() => {
  resetMockStore();
  setAuthentication({ accessToken: 'valid-token', tokenType: 'Bearer', expiresIn: 60, memberId: 1 });
  server.use(...propertyHandlers);
});
afterEach(() => {
  resetAuthenticationForTests();
  queryClient.clear();
  document.body.style.overflow = '';
});

it('열리면 뒤 화면 스크롤을 막고 닫기 버튼에 초점을 주며, Esc로 닫고 닫히면 스크롤을 되돌린다', () => {
  document.body.style.overflow = 'auto';
  const onClose = vi.fn();
  const { unmount } = render(
    <QueryClientProvider client={queryClient}>
      <PublicConfigProvider config={{ apiBaseUrl: 'http://localhost:8080' }}>
        <PropertyPhotoViewer propertyId={10} propertyName="망원동 투룸" initialIndex={0} onClose={onClose} />
      </PublicConfigProvider>
    </QueryClientProvider>,
  );

  expect(document.body.style.overflow).toBe('hidden');
  expect(screen.getByRole('button', { name: '사진 크게 보기 닫기' })).toHaveFocus();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);

  unmount();
  expect(document.body.style.overflow).toBe('auto');
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
});
