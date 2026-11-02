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
  /**
   * 처음 여는 화면의 뼈대. 남겨 둘 내용이 없는 화면이라 늦추지 않고 기다리는 동안 바로 보여 주고, 로딩 문구는 띄우지 않는다.
   * 라우트 Suspense 대체 화면과 같은 뼈대를 넘기면 뼈대에서 내용으로 한 번만 바뀐다.
   */
  skeleton?: ReactNode;
  describeError: (error: unknown) => QueryErrorView;
  /** 오류 화면에 함께 보여 줄 돌아가기 링크 같은 동작. */
  errorAction?: ReactNode;
  children: (data: TData) => ReactNode;
};

/**
 * 조회 결과를 기다리는 동안과 실패했을 때의 화면을 대신 그린다.
 * 짧은 요청에는 로딩을 생략하고, 한 번 보인 로딩은 잠깐 유지해 깜빡임을 줄인다. 뼈대(`skeleton`)를 주면 늦추지 않고 뼈대를 그린다.
 */
const QueryState = <TData,>({
  query,
  loadingTitle,
  skeleton,
  describeError,
  errorAction,
  children,
}: QueryStateProps<TData>) => {
  const hasSkeleton = skeleton !== undefined;
  const isLoadingVisible = useDelayedLoading(query.isPending && !hasSkeleton);

  if (query.isPending && hasSkeleton) return <>{skeleton}</>;

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
