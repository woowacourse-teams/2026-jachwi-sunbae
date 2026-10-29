import { css } from '@emotion/css';
import { useState } from 'react';

import { httpsUrl } from '@/features/meal-deals/lib/presentation';
import Icon from '@/shared/ui/icon/Icon';

type ProductImageProps = { src: string; name: string };

const ProductImage = ({ src, name }: ProductImageProps) => {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const url = httpsUrl(src);
  return (
    <div className={styles.frame}>
      {url && failedSource !== src ? (
        <img src={url} alt={name} loading="lazy" decoding="async" onError={() => setFailedSource(src)} />
      ) : (
        <span role="img" aria-label={`${name} 이미지 없음`}>
          <Icon name="image" size={28} />
          <small>이미지 준비 중</small>
        </span>
      )}
    </div>
  );
};
const styles = {
  frame: css`
    label: ProductImage-frame;
    aspect-ratio: 1;
    width: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);
    & img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    & span {
      display: grid;
      gap: 0.5rem;
      justify-items: center;
      color: var(--color-muted);
      font-size: 0.75rem;
    }
  `,
};
export default ProductImage;
