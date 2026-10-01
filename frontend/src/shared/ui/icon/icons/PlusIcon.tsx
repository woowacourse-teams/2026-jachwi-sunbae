import IconBase, { type IconProps } from '../IconBase';

const PlusIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconBase>
);

export default PlusIcon;
