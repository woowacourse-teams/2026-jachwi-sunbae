import IconBase, { type IconProps } from '../IconBase';

const ChevronDownIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="m6 9 6 6 6-6" />
  </IconBase>
);

export default ChevronDownIcon;
