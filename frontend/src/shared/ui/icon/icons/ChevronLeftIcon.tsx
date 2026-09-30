import IconBase, { type IconProps } from '../IconBase';

const ChevronLeftIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="m15 18-6-6 6-6" />
  </IconBase>
);

export default ChevronLeftIcon;
