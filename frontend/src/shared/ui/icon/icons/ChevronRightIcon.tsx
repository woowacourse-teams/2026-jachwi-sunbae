import IconBase, { type IconProps } from '../IconBase';

const ChevronRightIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="m9 18 6-6-6-6" />
  </IconBase>
);

export default ChevronRightIcon;
