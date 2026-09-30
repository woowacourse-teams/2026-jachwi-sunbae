import IconBase, { type IconProps } from '../IconBase';

const SearchIcon = (props: Omit<IconProps, 'children'>) => (
  <IconBase {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m16.5 16.5 4 4" />
  </IconBase>
);

export default SearchIcon;
