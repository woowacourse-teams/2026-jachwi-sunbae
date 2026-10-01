import IconBase, { type IconProps } from '../IconBase';

const HomeIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="m3 10.5 9-7.5 9 7.5" />
    <path d="M5.5 9.5V21h13V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </IconBase>
);

export default HomeIcon;
