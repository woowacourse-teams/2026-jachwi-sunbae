import { Component, Suspense } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import ContentState from './ui/ContentState';

class RouteErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The retry is deliberately user-triggered so an unavailable chunk does not create a reload loop.
  }

  render() {
    if (this.state.hasError) {
      return (
        <ContentState
          tone="error"
          title="화면을 불러오지 못했어요."
          description="새 배포로 화면 파일이 바뀌었을 수 있어요."
          retryLabel="새로고침해 다시 시도"
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

const LazyRouteBoundary = ({ children }: { children: ReactNode }) => (
  <RouteErrorBoundary>
    <Suspense fallback={<ContentState loading title="화면을 불러오는 중이에요." />}>{children}</Suspense>
  </RouteErrorBoundary>
);

export default LazyRouteBoundary;
