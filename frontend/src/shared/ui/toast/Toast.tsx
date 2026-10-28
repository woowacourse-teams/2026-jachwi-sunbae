import { css, keyframes } from '@emotion/css';
import { useEffect } from 'react';

type ToastProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  /** 0이면 자동으로 닫지 않는다. */
  duration?: number;
  className?: string;
};

const Toast = ({ title, description, isOpen, onClose, duration = 8000, className }: ToastProps) => {
  useEffect(() => {
    if (!isOpen || duration <= 0) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);
  if (!isOpen) return null;
  return (
    <aside
      className={[styles.toast, className].filter(Boolean).join(' ')}
      role="status"
      aria-label={title}
      aria-live="polite"
      aria-atomic="true"
    >
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </aside>
  );
};

const slideUpKeyframes = keyframes`
  from {
    opacity: 0;
    transform: translateY(2rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const styles = {
  toast: css`
    label: Toast-toast;
    position: absolute;
    bottom: calc(1rem + env(safe-area-inset-bottom));
    left: 1rem;
    right: 1rem;
    z-index: 40;
    padding: 1rem 1.1rem;
    border-radius: 0.9rem;
    background: rgb(255 255 255 / 96%);
    color: var(--color-ink);
    box-shadow: 0 3px 16px rgb(0 0 0 / 12%);
    pointer-events: none;
    animation: ${slideUpKeyframes} 280ms cubic-bezier(0.16, 1, 0.3, 1) both;

    & strong {
      font-size: 0.95rem;
    }

    & p {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      line-height: 1.55;
      color: var(--color-ink-soft);
      white-space: pre-line;
    }

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
};

export default Toast;
