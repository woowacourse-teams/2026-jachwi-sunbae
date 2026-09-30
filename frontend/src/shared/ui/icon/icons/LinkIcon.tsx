import IconBase, { type IconProps } from '../IconBase';

const LinkIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" />
  </IconBase>
);

export default LinkIcon;
