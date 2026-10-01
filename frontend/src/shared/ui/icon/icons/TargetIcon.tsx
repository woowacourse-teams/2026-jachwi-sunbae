import IconBase, { type IconProps } from '../IconBase';

const TargetIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 2v3" />
    <path d="M12 19v3" />
    <path d="M2 12h3" />
    <path d="M19 12h3" />
  </IconBase>
);

export default TargetIcon;
