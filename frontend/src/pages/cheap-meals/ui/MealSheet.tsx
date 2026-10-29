import { css } from '@emotion/css';
import type { ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import BottomSheet from '@/shared/ui/bottom-sheet/BottomSheet';

type MealSheetProps = { title: string; children: ReactNode; onClose: () => void };

const MealSheet = ({ title, children, onClose }: MealSheetProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    const focused = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (focused instanceof HTMLElement && focused.isConnected) focused.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label={title}
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <BottomSheet title={title} onClose={onClose} initialHeightPercent={80}>
        <div className={styles.content}>{children}</div>
      </BottomSheet>
    </dialog>,
    document.body,
  );
};
const styles = {
  dialog: css`
    label: MealSheet-dialog;
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-ink);
    overflow: hidden;
    &::backdrop {
      background: var(--color-overlay);
    }
    & .BottomSheet-sheet {
      max-height: calc(100% - env(safe-area-inset-top) - 1rem);
    }
    & .BottomSheet-sheet header h2 {
      white-space: normal;
      overflow-wrap: anywhere;
    }
    & .BottomSheet-sheet header button {
      min-width: 44px;
      min-height: 44px;
    }
  `,
  content: css`
    label: MealSheet-content;
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
    overflow-wrap: anywhere;
  `,
};
export default MealSheet;
