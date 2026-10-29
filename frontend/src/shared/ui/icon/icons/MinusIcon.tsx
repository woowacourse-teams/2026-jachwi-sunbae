import IconBase, { type IconProps } from '../IconBase';

const MinusIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="M5 12h14" />
  </IconBase>
);

export default MinusIcon;
