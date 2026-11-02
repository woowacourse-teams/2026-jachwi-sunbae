import type { ReactNode } from 'react';

import ContentState from '../content-state/ContentState';

type QueryLike<TData> = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: TData | undefined;
  refetch: () => unknown;
};

export type QueryErrorView = {
  title: string;
  description?: ReactNode;
  /** 다시 시도해도 결과가 같은 오류(없는 리소스 등)는 끈다. */
  canRetry: boolean;
};

type QueryStateProps<TData> = {
  query: QueryLike<TData>;
  loadingTitle: string;
  /** 화면 뼈대. 주면 기다리는 동안 로딩 문구 대신 뼈대를 그려, 뼈대에서 내용으로 한 번만 바뀐다. */
  skeleton?: ReactNode;
  describeError: (error: unknown) => QueryErrorView;
  /** 오류 화면에 함께 보여 줄 돌아가기 링크 같은 동작. */
  errorAction?: ReactNode;
  children: (data: TData) => ReactNode;
};

/**
 * 페이지 전체를 조회 결과로 그릴 때, 기다리는 동안과 실패했을 때의 화면을 대신 그린다.
 * 페이지를 바꾸는 중이라 남겨 둘 내용이 없으므로 로딩을 늦추지 않고 바로 보여 준다. 뼈대(`skeleton`)를 주면 뼈대를 그린다.
 */
const QueryState = <TData,>({
  query,
  loadingTitle,
  skeleton,
  describeError,
  errorAction,
  children,
}: QueryStateProps<TData>) => {
  if (query.isPending) return skeleton === undefined ? <ContentState loading title={loadingTitle} /> : <>{skeleton}</>;

  if (query.isError || query.data === undefined) {
    const { title, description, canRetry } = describeError(query.error);
    return (
      <ContentState
        tone="error"
        title={title}
        description={description}
        onRetry={canRetry ? () => void query.refetch() : undefined}
      >
        {errorAction}
      </ContentState>
    );
  }

  return children(query.data);
};

export default QueryState;
