import IconBase, { type IconProps } from '../IconBase';

const MoreVerticalIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </IconBase>
);

export default MoreVerticalIcon;
