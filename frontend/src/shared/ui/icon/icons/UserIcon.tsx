import IconBase, { type IconProps } from '../IconBase';

const UserIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
  </IconBase>
);

export default UserIcon;
