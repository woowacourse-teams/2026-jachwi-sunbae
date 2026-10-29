import { useEffect } from 'react';

const SERVICE_NAME = '자취선배';

/**
 * 화면마다 탭 제목을 `화면 이름 | 자취선배`로 바꾼다. 스크린 리더는 화면에 들어올 때 이 제목을 먼저 읽는다.
 * 화면을 떠나면 들어오기 전 제목으로 되돌린다. `undefined`를 넘기면 제목을 건드리지 않는다.
 */
const useDocumentTitle = (pageTitle: string | undefined) => {
  useEffect(() => {
    if (pageTitle === undefined) return;
    const previousTitle = document.title;
    document.title = `${pageTitle} | ${SERVICE_NAME}`;
    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle]);
};

export default useDocumentTitle;
