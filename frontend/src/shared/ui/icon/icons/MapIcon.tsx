import IconBase, { type IconProps } from '../IconBase';

const MapIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="m3 6 5-2 8 2 5-2v14l-5 2-8-2-5 2Z" />
    <path d="M8 4v14" />
    <path d="M16 6v14" />
  </IconBase>
);

export default MapIcon;
