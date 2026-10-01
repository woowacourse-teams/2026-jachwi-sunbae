import IconBase, { type IconProps } from '../IconBase';

const ImageIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="9" r="1.5" />
    <path d="m4 17 4.5-4.5 3.2 3.2 2.3-2.3 6 6" />
  </IconBase>
);

export default ImageIcon;
