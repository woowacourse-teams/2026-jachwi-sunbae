import { useCallback, useState } from 'react';

import { searchAddress } from '@/features/map/api/mapApi';
import type { MapAddress } from '@/features/map/model/Map';
import { usePublicConfig } from '@/shared/config/PublicConfigContext';

const useMapSearch = () => {
  const config = usePublicConfig();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapAddress[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const executeSearch = useCallback(
    async (text: string) => {
      if (text.trim() === '') return;
      setSearchStatus('loading');
      try {
        setSearchResults(await searchAddress(config, text.trim()));
        setSearchStatus('idle');
      } catch {
        setSearchStatus('error');
      }
    },
    [config],
  );

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchStatus('idle');
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchStatus('idle');
  }, []);

  return {
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchStatus,
    executeSearch,
    closeSearch,
    clearSearch,
  };
};

export default useMapSearch;
