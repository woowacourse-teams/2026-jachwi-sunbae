import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

type RestaurantOverlayState = { restaurantOverlay?: boolean };

/** 업소 상세와 주소 검색은 하나의 이력만 사용해 닫기 한 번으로 목록으로 돌아간다. */
const useRestaurantOverlay = () => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isSearchOpen = params.get('search') === '1';
  const selectedStoreId = params.get('store');
  const hasOverlay = isSearchOpen || selectedStoreId !== null;
  const hasOverlayHistory = (location.state as RestaurantOverlayState | null)?.restaurantOverlay === true;

  const createBaseParams = () => {
    const next = new URLSearchParams(params);
    next.delete('store');
    next.delete('search');
    return next;
  };
  const openOverlay = (key: 'store' | 'search', value: string) => {
    const next = createBaseParams();
    next.set(key, value);
    setParams(next, {
      replace: hasOverlay,
      state: { restaurantOverlay: hasOverlayHistory || !hasOverlay },
    });
  };
  const closeOverlay = () => {
    if (!hasOverlay) return;
    if (hasOverlayHistory) navigate(-1);
    // 직접 진입한 상세 URL은 이전 사이트로 이탈하지 않고 현재 주소의 상세만 닫는다.
    else setParams(createBaseParams(), { replace: true, state: null });
  };

  return {
    isSearchOpen,
    selectedStoreId,
    openSearch: () => openOverlay('search', '1'),
    openStore: (id: number) => openOverlay('store', String(id)),
    closeOverlay,
  };
};

export default useRestaurantOverlay;
