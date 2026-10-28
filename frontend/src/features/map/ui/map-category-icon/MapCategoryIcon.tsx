import { css } from '@emotion/css';

import type { MapCategory } from '../../model/Map';

type MapCategoryIconProps = {
  category: MapCategory;
  className?: string;
};

const classNames = (...names: Array<string | undefined>): string => names.filter(Boolean).join(' ');

export const MapCategoryIcon = ({ category, className }: MapCategoryIconProps) => (
  <span className={classNames(styles.icon, className)} data-map-category-icon={category} aria-hidden="true" />
);

export const createMapCategoryIconElement = (category: MapCategory, className?: string): HTMLSpanElement => {
  const element = document.createElement('span');
  element.className = classNames(styles.icon, className);
  element.dataset.mapCategoryIcon = category;
  element.setAttribute('aria-hidden', 'true');
  return element;
};

const styles = {
  icon: css`
    label: MapCategoryIcon-icon;
    position: relative;
    display: block;
    width: 1em;
    height: 1em;
    box-sizing: border-box;
    border: 0.12em solid currentcolor;
    border-radius: 0.26em;
    color: inherit;

    &::before,
    &::after {
      position: absolute;
      background: currentcolor;
      content: '';
    }

    &[data-map-category-icon='HOSPITAL']::before {
      top: 50%;
      left: 50%;
      width: 0.56em;
      height: 0.12em;
      transform: translate(-50%, -50%);
    }

    &[data-map-category-icon='HOSPITAL']::after {
      top: 50%;
      left: 50%;
      width: 0.12em;
      height: 0.56em;
      transform: translate(-50%, -50%);
    }

    &[data-map-category-icon='TRANSPORT']::before {
      right: 0.14em;
      bottom: 0.18em;
      left: 0.14em;
      height: 0.12em;
      border-radius: 999px;
      box-shadow: 0 -0.34em 0 currentcolor;
    }

    &[data-map-category-icon='TRANSPORT']::after {
      right: 0.13em;
      bottom: -0.18em;
      width: 0.14em;
      height: 0.14em;
      border-radius: 50%;
      box-shadow: -0.48em 0 0 currentcolor;
    }

    &[data-map-category-icon='SCHOOL'] {
      border-radius: 0.12em 0.12em 0.28em 0.28em;
    }

    &[data-map-category-icon='SCHOOL']::before {
      top: -0.27em;
      left: 50%;
      width: 0.66em;
      height: 0.66em;
      box-sizing: border-box;
      border: 0.12em solid currentcolor;
      border-right: 0;
      border-bottom: 0;
      background: transparent;
      transform: translateX(-50%) rotate(45deg);
    }

    &[data-map-category-icon='SCHOOL']::after {
      bottom: 0;
      left: 50%;
      width: 0.12em;
      height: 0.42em;
      transform: translateX(-50%);
    }

    &[data-map-category-icon='CONVENIENCE']::before {
      top: 0.12em;
      right: 0.08em;
      left: 0.08em;
      height: 0.27em;
      border-radius: 0.08em 0.08em 45% 45%;
    }

    &[data-map-category-icon='CONVENIENCE']::after {
      right: 0.16em;
      bottom: 0.1em;
      left: 0.16em;
      height: 0.22em;
      box-sizing: border-box;
      border: 0.12em solid currentcolor;
      background: transparent;
    }

    &[data-map-category-icon='AGENCY']::before {
      bottom: 0;
      left: 50%;
      width: 0.16em;
      height: 0.58em;
      box-shadow:
        -0.29em 0.12em 0 -0.02em currentcolor,
        0.29em -0.07em 0 -0.02em currentcolor;
      transform: translateX(-50%);
    }

    &[data-map-category-icon='AGENCY']::after {
      bottom: 0.13em;
      left: 50%;
      width: 0.72em;
      height: 0.1em;
      transform: translateX(-50%);
    }

    /* 거리 메모: 글줄 두 개와 접힌 모서리. */
    &[data-map-category-icon='MEMO'] {
      border-radius: 0.2em 0.2em 0.42em 0.2em;
    }

    &[data-map-category-icon='MEMO']::before {
      top: 0.22em;
      left: 0.16em;
      width: 0.46em;
      height: 0.1em;
      border-radius: 999px;
      box-shadow: 0 0.2em 0 currentcolor;
    }

    &[data-map-category-icon='MEMO']::after {
      right: -0.02em;
      bottom: -0.02em;
      width: 0.3em;
      height: 0.3em;
      border-top-left-radius: 0.1em;
    }
  `,
};

export default MapCategoryIcon;
