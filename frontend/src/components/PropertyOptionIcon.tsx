import type { PropertyOptionKey } from '../constants/propertyOptions';

type PropertyOptionIconProps = {
  option: PropertyOptionKey;
  className?: string;
};

/** 옵션마다 다른 글리프. 선으로만 그려 선택 상태와 상관없이 읽힌다. */
const PATHS: Record<PropertyOptionKey, string> = {
  airConditioner: 'M3 6h18v6H3zM6 15v2M10 15v2M14 15v2M18 15v2',
  refrigerator: 'M6 3h12v18H6zM6 10h12M9 6.5v1.5M9 13v2',
  washer: 'M4 3h16v18H4zM12 8a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM7 6h2',
  sink: 'M3 11h18M5 11V7a3 3 0 0 1 3-3h3v7M8 15v4M16 15v4M4 11v3a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-3',
  stove:
    'M4 4h16v16H4zM8.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM15.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 14h8',
  microwave: 'M3 6h18v12H3zM15 6v12M6 10h5M6 13h5M18 15v.01',
  shoeRack: 'M3 16h6l4 2h8v2H3zM3 16V9a2 2 0 0 1 2-2h2l2 4',
  closet: 'M5 3h14v18H5zM12 3v18M9.5 11v2M14.5 11v2',
  bed: 'M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 14h18M7 9V7h5v2M3 18v2M21 18v2',
  desk: 'M3 9h18M4 9v11M20 9v11M9 9v5h8M3 6h18',
  tv: 'M3 5h18v12H3zM8 21h8M12 17v4',
  induction: 'M4 4h16v16H4zM9 9.5a3 3 0 1 0 0 5M15 9.5a3 3 0 1 1 0 5',
};

const PropertyOptionIcon = ({ option, className }: PropertyOptionIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={PATHS[option]} />
  </svg>
);

export default PropertyOptionIcon;
