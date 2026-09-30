import IconBase, { type IconProps } from '../IconBase';

const InboxIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="M4 5h16v14H4z" />
    <path d="M4 14h4l2 2h4l2-2h4" />
  </IconBase>
);

export default InboxIcon;
