import type { Member } from '../model/Member';
import type { PublicConfig } from '../../../shared/config/publicConfigTypes';
import { apiRequest } from './apiClient';
import { parseMemberDto } from './authParsers';

export const fetchCurrentMember = (config: PublicConfig, signal?: AbortSignal): Promise<Member> =>
  apiRequest({
    config,
    path: '/api/members/me',
    signal,
    parseData: parseMemberDto,
  });
