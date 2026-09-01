import type { LinkProps } from 'react-router-dom';
import { Button, ButtonLink } from './Button';
import Icon from './Icon';
import styles from './AddItemAction.module.css';

type AddItemActionProps = {
  children: string;
  disabled?: boolean;
} & ({ to: LinkProps['to']; onClick?: never } | { to?: never; onClick: () => void });

/** 목록에 무언가를 더하는 진입점. 이동이면 `to`, 그 자리에서 열면 `onClick`을 준다. */
const AddItemAction = ({ children, disabled, to, onClick }: AddItemActionProps) => {
  const content = (
    <>
      <Icon name="plus" size={16} /> {children}
    </>
  );

  if (to !== undefined) {
    return (
      <ButtonLink to={to} className={styles.action} variant="secondary" fullWidth>
        {content}
      </ButtonLink>
    );
  }

  return (
    <Button type="button" className={styles.action} variant="secondary" fullWidth disabled={disabled} onClick={onClick}>
      {content}
    </Button>
  );
};

export default AddItemAction;
