import type { ReactNode } from 'react';
import TopNavigation from './ui/TopNavigation';
import styles from './ChecklistPageLayout.module.css';

type ChecklistPageLayoutProps = {
  title: string;
  children: ReactNode;
  backTo?: string;
  onBack?: () => void;
  backLabel?: string;
  navigationIcon?: 'arrow-left' | 'close';
  endSlot?: ReactNode;
  className?: string;
  containerClassName?: string;
};

const ChecklistPageLayout = ({
  title,
  children,
  backTo,
  onBack,
  backLabel,
  navigationIcon,
  endSlot,
  className,
  containerClassName,
}: ChecklistPageLayoutProps) => (
  <main className={`${styles.page} ${className ?? ''}`}>
    <div className={`${styles.container} ${containerClassName ?? ''}`}>
      <TopNavigation
        title={title}
        backTo={backTo}
        onBack={onBack}
        backLabel={backLabel}
        navigationIcon={navigationIcon}
        endSlot={endSlot}
      />
      {children}
    </div>
  </main>
);

export default ChecklistPageLayout;
