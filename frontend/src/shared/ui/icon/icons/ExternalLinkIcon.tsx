import IconBase, { type IconProps } from '../IconBase';

const ExternalLinkIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <path d="M14 4h6v6" />
    <path d="m20 4-9 9" />
    <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
  </IconBase>
);

export default ExternalLinkIcon;
