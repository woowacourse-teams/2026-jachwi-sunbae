import type { ReactNode } from 'react';

import useDelayedLoading from '@/shared/lib/hooks/useDelayedLoading';

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
  describeError: (error: unknown) => QueryErrorView;
  /** 오류 화면에 함께 보여 줄 돌아가기 링크 같은 동작. */
  errorAction?: ReactNode;
  children: (data: TData) => ReactNode;
};

/**
 * 조회 결과를 기다리는 동안과 실패했을 때의 화면을 대신 그린다.
 * 짧은 요청에는 로딩을 생략하고, 한 번 보인 로딩은 잠깐 유지해 깜빡임을 줄인다.
 */
const QueryState = <TData,>({ query, loadingTitle, describeError, errorAction, children }: QueryStateProps<TData>) => {
  const isLoadingVisible = useDelayedLoading(query.isPending);

  if (query.isPending || isLoadingVisible) {
    return isLoadingVisible ? (
      <ContentState loading title={loadingTitle} />
    ) : (
      <main className="property-page">
        <div className="page-container" />
      </main>
    );
  }

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
