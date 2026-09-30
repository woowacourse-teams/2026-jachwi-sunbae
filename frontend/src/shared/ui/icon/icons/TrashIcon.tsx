import IconBase, { type IconProps } from '../IconBase';

const TrashIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="m6 7 1 13h10l1-13" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </IconBase>
);

export default TrashIcon;
