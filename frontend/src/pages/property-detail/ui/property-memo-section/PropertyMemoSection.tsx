import { useEffect, useRef, useState } from 'react';

import { usePropertyMemo } from '@/features/property/api/useProperties';
import { useSavePropertyMemoDocument } from '@/features/property/api/usePropertyMutations';
import { Button } from '@/shared/ui/button/Button';

import PropertyDetailSection from '../property-detail-section/PropertyDetailSection';
import PropertyMemoContent from './PropertyMemoContent';

import styles from './PropertyMemoSection.module.css';

type PropertyMemoSectionProps = {
  propertyId: number;
};

const PropertyMemoSection = ({ propertyId }: PropertyMemoSectionProps) => {
  const memo = usePropertyMemo(propertyId);
  const saveMemo = useSavePropertyMemoDocument(propertyId);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <>
      <PropertyDetailSection title="메모">
        <PropertyMemoContent
          memo={memo}
          triggerRef={triggerRef}
          onEdit={() => {
            if (memo.data === undefined) return;
            setDraft(memo.data.freeMemo);
            setIsOpen(true);
          }}
        />
      </PropertyDetailSection>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="quick-memo-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          if (!saveMemo.isPending) setIsOpen(false);
        }}
        onClose={() => {
          if (isOpen && !saveMemo.isPending) setIsOpen(false);
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (memo.data === undefined) return;
            void saveMemo
              .mutateAsync({ freeMemo: draft.trim() })
              .then(() => setIsOpen(false))
              .catch(() => undefined);
          }}
        >
          <h2 id="quick-memo-dialog-title">메모</h2>
          <textarea
            id="quick-memo-input"
            aria-label="메모 내용"
            value={draft}
            maxLength={2_000}
            rows={5}
            placeholder="그 외 내용을 자유롭게 적어보세요."
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
          />
          {saveMemo.isError && <p className={styles.error}>메모를 저장하지 못했어요. 다시 시도해 주세요.</p>}
          <div className={styles.actions}>
            <Button variant="neutral" fullWidth disabled={saveMemo.isPending} onClick={() => setIsOpen(false)}>
              취소
            </Button>
            <Button type="submit" fullWidth isLoading={saveMemo.isPending} loadingLabel="저장 중…">
              저장
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
};

export default PropertyMemoSection;
