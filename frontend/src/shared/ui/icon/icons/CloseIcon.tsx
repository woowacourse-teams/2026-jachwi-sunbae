import IconBase, { type IconProps } from '../IconBase';

const CloseIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="m7 7 10 10" />
    <path d="M17 7 7 17" />
  </IconBase>
);

export default CloseIcon;
