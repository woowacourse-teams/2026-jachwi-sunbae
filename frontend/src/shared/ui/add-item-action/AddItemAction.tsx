import { css } from '@emotion/css';
import type { LinkProps } from 'react-router-dom';

import { Button, ButtonLink } from '../button/Button';
import PlusIcon from '../icon/icons/PlusIcon';

type AddItemActionProps = {
  children: string;
  disabled?: boolean;
} & ({ to: LinkProps['to']; onClick?: never } | { to?: never; onClick: () => void });

/** 목록에 무언가를 더하는 진입점. 이동이면 `to`, 그 자리에서 열면 `onClick`을 준다. */
const AddItemAction = ({ children, disabled, to, onClick }: AddItemActionProps) => {
  const content = (
    <>
      <PlusIcon size={16} /> {children}
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

const styles = {
  action: css`
    label: AddItemAction-action;
    min-height: 2.95rem;
    border: 1px dashed var(--color-border-strong);
    background: var(--color-surface);
    color: var(--color-ink-soft);
    font-size: 0.8rem;

    &:hover:not(:disabled) {
      border-color: var(--color-muted);
      background: var(--color-surface-neutral);
      color: var(--color-ink);
    }
  `,
};

export default AddItemAction;
