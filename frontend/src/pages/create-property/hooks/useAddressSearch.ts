import { useState } from 'react';

import { searchAddress } from '@/features/map/api/mapApi';
import type { MapAddress } from '@/features/map/model/Map';
import { usePublicConfig } from '@/shared/config/PublicConfigContext';
import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';

export type AddressSearchStatus = 'idle' | 'loading' | 'error';

const formatAddress = (address: MapAddress) => address.roadAddress ?? address.jibunAddress ?? address.address ?? '';

const useAddressSearch = () => {
  const config = usePublicConfig();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapAddress[]>([]);
  const [status, setStatus] = useState<AddressSearchStatus>('idle');

  const changeQuery = (value: string) => {
    setQuery(value);
    setResults([]);
    setStatus('idle');
  };

  const clear = () => changeQuery('');

  const submit = async () => {
    if (query.trim() === '') return;
    trackPostHogEvent('address_search_started');
    setStatus('loading');
    try {
      setResults(await searchAddress(config, query.trim()));
      setStatus('idle');
    } catch {
      trackPostHogEvent('address_search_failed', { error_kind: 'server' });
      setResults([]);
      setStatus('error');
    }
  };

  /** 고른 결과를 검색어로 남기고 목록을 닫는다. */
  const pick = (result: MapAddress) => {
    setResults([]);
    setQuery(formatAddress(result));
  };

  return { query, results, status, setStatus, changeQuery, clear, submit, pick };
};

export default useAddressSearch;
