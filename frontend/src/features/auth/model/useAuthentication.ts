import { useSyncExternalStore } from 'react';
import { getAuthenticationSnapshot, subscribeAuthentication } from './authStore';

export const useAuthentication = () =>
  useSyncExternalStore(subscribeAuthentication, getAuthenticationSnapshot, getAuthenticationSnapshot);
