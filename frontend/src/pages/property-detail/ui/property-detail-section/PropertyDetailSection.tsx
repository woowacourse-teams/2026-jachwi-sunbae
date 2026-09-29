import { useId } from 'react';
import type { ReactNode } from 'react';
import styles from './PropertyDetailSection.module.css';

type PropertyDetailSectionProps = {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

const PropertyDetailSection = ({ title, meta, action, children }: PropertyDetailSectionProps) => {
  const headingId = useId();

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.heading}>
        <div>
          <h2 id={headingId}>{title}</h2>
          {meta}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
};

export default PropertyDetailSection;
