import { useSearchParams } from 'react-router-dom';

const MODE_PARAM = 'mode';
const ADD_ITEMS_MODE = 'add-items';

/**
 * 체크 항목 추가 화면을 `?mode=add-items`로 연다.
 * 뒤로 가기로 편집 화면에 돌아올 수 있도록 열 때는 기록을 남기고, 닫을 때는 대체한다.
 */
const useChecklistItemPickerRoute = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const setMode = (isOpen: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (isOpen) next.set(MODE_PARAM, ADD_ITEMS_MODE);
    else next.delete(MODE_PARAM);
    setSearchParams(next, { replace: !isOpen });
  };

  return {
    isPickerOpen: searchParams.get(MODE_PARAM) === ADD_ITEMS_MODE,
    openPicker: () => setMode(true),
    closePicker: () => setMode(false),
  };
};

export default useChecklistItemPickerRoute;
