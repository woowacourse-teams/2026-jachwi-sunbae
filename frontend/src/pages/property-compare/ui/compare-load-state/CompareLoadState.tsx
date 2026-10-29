import { css, keyframes } from '@emotion/css';
import type { ReactNode } from 'react';

import { getPropertyErrorMessage } from '@/features/property/api/propertyErrorMessages';
import type { usePropertyList } from '@/features/property/api/useProperties';
import { Button } from '@/shared/ui/button/Button';
import DelayedFallback from '@/shared/ui/delayed-fallback/DelayedFallback';
import InlineNotice from '@/shared/ui/inline-notice/InlineNotice';

type CompareLoadStateProps = {
  properties: ReturnType<typeof usePropertyList>;
  /** 매물을 받은 뒤에만 그리는 비교 화면 내용. */
  children: () => ReactNode;
};

/**
 * 비교할 매물을 불러오는 동안과 불러오지 못했을 때의 안내를 맡고, 받은 뒤에만 내용을 그린다.
 * 빠른 응답에는 로딩 안내 없이 바로 내용을 보여 주고, 오래 걸릴 때만 알린다. 한 번 보인 안내는 잠깐 남겨 깜빡이지 않게 한다.
 */
const CompareLoadState = ({ properties, children }: CompareLoadStateProps) => (
  <DelayedFallback
    isPending={properties.isPending}
    fallback={
      <div className={styles.loading} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        매물을 불러오는 중이에요.
      </div>
    }
  >
    {() =>
      properties.isError ? (
        <div className={styles.errorState}>
          <InlineNotice tone="error">{getPropertyErrorMessage(properties.error)}</InlineNotice>
          <Button variant="secondary" fullWidth onClick={() => void properties.refetch()}>
            다시 시도
          </Button>
        </div>
      ) : (
        children()
      )
    }
  </DelayedFallback>
);

const spinKeyframes = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const styles = {
  loading: css`
    label: CompareLoadState-loading;
    display: grid;
    gap: 0.75rem;
    min-height: 10rem;
    align-content: center;
    justify-items: center;
    color: var(--color-muted);
    font-size: 0.75rem;
  `,

  errorState: css`
    label: CompareLoadState-errorState;
    display: grid;
    gap: 0.75rem;
  `,

  spinner: css`
    label: CompareLoadState-spinner;
    width: 1.35rem;
    height: 1.35rem;
    border: 3px solid color-mix(in srgb, var(--color-primary) 22%, transparent);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: ${spinKeyframes} 800ms linear infinite;
  `,
};

export default CompareLoadState;
