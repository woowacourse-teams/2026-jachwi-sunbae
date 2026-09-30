import IconBase, { type IconProps } from '../IconBase';

const ArrowRightIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="m9 18 6-6-6-6" />
    <path d="M5 12h10" />
  </IconBase>
);

export default ArrowRightIcon;
