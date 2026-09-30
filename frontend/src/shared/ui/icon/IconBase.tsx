import type { ReactNode } from 'react';

export type IconProps = {
  size?: number;
  className?: string;
  children: ReactNode;
};

/** 개별 아이콘이 공유하는 SVG 표시 규칙. 아이콘 모양은 각 파일이 소유한다. */
const IconBase = ({ size = 20, className, children }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export default IconBase;
