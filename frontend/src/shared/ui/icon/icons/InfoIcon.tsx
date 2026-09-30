import IconBase, { type IconProps } from '../IconBase';

const InfoIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </IconBase>
);

export default InfoIcon;
