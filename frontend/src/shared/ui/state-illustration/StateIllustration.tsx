import { css } from '@emotion/css';

import emptyProperties from '@/shared/assets/illustrations/goose-empty-properties.webp';
import emptyProperties2x from '@/shared/assets/illustrations/goose-empty-properties@2x.webp';
import emptySearch from '@/shared/assets/illustrations/goose-empty-search.webp';
import emptySearch2x from '@/shared/assets/illustrations/goose-empty-search@2x.webp';
import error from '@/shared/assets/illustrations/goose-error.webp';
import error2x from '@/shared/assets/illustrations/goose-error@2x.webp';
import notFound from '@/shared/assets/illustrations/goose-not-found.webp';
import notFound2x from '@/shared/assets/illustrations/goose-not-found@2x.webp';

export type StateIllustrationName = 'error' | 'empty-properties' | 'empty-search' | 'not-found';

const SOURCES: Record<StateIllustrationName, [string, string]> = {
  error: [error, error2x],
  'empty-properties': [emptyProperties, emptyProperties2x],
  'empty-search': [emptySearch, emptySearch2x],
  'not-found': [notFound, notFound2x],
};

type Props = {
  name: StateIllustrationName;
  /** 그리는 폭(rem). 그림은 정사각형이다. */
  size?: number;
  className?: string;
};

/**
 * 오류, 빈 목록, 검색 결과 없음, 없는 페이지에서 안내 글 위에 두는 오리 그림. 장식이라 화면 낭독기는 읽지 않는다.
 * 128px과 2배 256px WebP를 두어 화면 배율에 맞게 고른다.
 */
const StateIllustration = ({ name, size = 7, className }: Props) => {
  const [src, src2x] = SOURCES[name];
  return (
    <img
      className={className ? `${styles.image} ${className}` : styles.image}
      style={{ width: `${size}rem` }}
      src={src}
      srcSet={`${src} 1x, ${src2x} 2x`}
      width={128}
      height={128}
      alt=""
      aria-hidden="true"
    />
  );
};

const styles = {
  image: css`
    label: StateIllustration-image;
    display: block;
    height: auto;
    margin: 0 auto;
  `,
};

export default StateIllustration;
