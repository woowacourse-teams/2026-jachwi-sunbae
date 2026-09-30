import IconBase, { type IconProps } from '../IconBase';

const ChevronUpIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="m6 15 6-6 6 6" />
  </IconBase>
);

export default ChevronUpIcon;
