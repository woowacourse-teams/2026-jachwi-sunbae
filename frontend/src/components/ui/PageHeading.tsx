import styles from './PageHeading.module.css';

type PageHeadingProps = {
  title: string;
  variant?: 'default' | 'overlap';
};

const PageHeading = ({ title, variant = 'default' }: PageHeadingProps) => (
  <h1 className={`${styles.heading} ${variant === 'overlap' ? styles.overlap : ''}`}>{title}</h1>
);

export default PageHeading;
