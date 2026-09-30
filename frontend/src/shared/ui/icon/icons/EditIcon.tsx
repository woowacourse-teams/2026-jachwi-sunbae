import IconBase, { type IconProps } from '../IconBase';

const EditIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </IconBase>
);

export default EditIcon;
