import { ADMIN_PATH } from '@/shared/lib/navigation/appPaths';

export const isAdminPath = (path: string): boolean => {
  const pathname = path.split(/[?#]/)[0];
  return pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`);
};

export const isAdminScreen = (): boolean => typeof window !== 'undefined' && isAdminPath(window.location.pathname);
