import IconBase, { type IconProps } from '../IconBase';

const ChecklistIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="M9 6h11" />
    <path d="M9 12h11" />
    <path d="M9 18h11" />
    <path d="m3.5 6 1.2 1.2L7 4.8" />
    <path d="m3.5 12 1.2 1.2L7 10.8" />
    <path d="m3.5 18 1.2 1.2L7 16.8" />
  </IconBase>
);

export default ChecklistIcon;
