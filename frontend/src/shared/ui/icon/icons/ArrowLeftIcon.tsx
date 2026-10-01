import IconBase, { type IconProps } from '../IconBase';

const ArrowLeftIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="m15 18-6-6 6-6" />
    <path d="M9 12h10" />
  </IconBase>
);

export default ArrowLeftIcon;
