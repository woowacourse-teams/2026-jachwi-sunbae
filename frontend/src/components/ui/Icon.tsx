export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'check-circle'
  | 'checklist'
  | 'close'
  | 'home'
  | 'image'
  | 'inbox'
  | 'info'
  | 'more-vertical'
  | 'pending-circle'
  | 'plus'
  | 'search'
  | 'user'
  | 'warning-triangle';

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

const IconPaths = ({ name }: { name: IconName }) => {
  switch (name) {
    case 'arrow-left':
      return (
        <>
          <path d="m15 18-6-6 6-6" />
          <path d="M9 12h10" />
        </>
      );
    case 'arrow-right':
      return (
        <>
          <path d="m9 18 6-6-6-6" />
          <path d="M5 12h10" />
        </>
      );
    case 'check-circle':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.6 2.6L16.5 9" />
        </>
      );
    case 'checklist':
      return (
        <>
          <path d="M9 6h11" />
          <path d="M9 12h11" />
          <path d="M9 18h11" />
          <path d="m3.5 6 1.2 1.2L7 4.8" />
          <path d="m3.5 12 1.2 1.2L7 10.8" />
          <path d="m3.5 18 1.2 1.2L7 16.8" />
        </>
      );
    case 'close':
      return (
        <>
          <path d="m7 7 10 10" />
          <path d="M17 7 7 17" />
        </>
      );
    case 'home':
      return (
        <>
          <path d="m3 10.5 9-7.5 9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </>
      );
    case 'image':
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="9" r="1.5" />
          <path d="m4 17 4.5-4.5 3.2 3.2 2.3-2.3 6 6" />
        </>
      );
    case 'inbox':
      return (
        <>
          <path d="M4 5h16v14H4z" />
          <path d="M4 14h4l2 2h4l2-2h4" />
        </>
      );
    case 'info':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </>
      );
    case 'more-vertical':
      return (
        <>
          <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
        </>
      );
    case 'pending-circle':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      );
    case 'plus':
      return (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      );
    case 'search':
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 4 4" />
        </>
      );
    case 'user':
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </>
      );
    case 'warning-triangle':
      return (
        <>
          <path d="M10.3 4.2 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </>
      );
  }
};

const Icon = ({ name, size = 20, className }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <IconPaths name={name} />
  </svg>
);

export default Icon;
