import { useMemo } from 'react';

import AddItemAction from '@/shared/ui/add-item-action/AddItemAction';
import BottomActionArea from '@/shared/ui/bottom-action-area/BottomActionArea';
import { Button } from '@/shared/ui/button/Button';

import { useActiveCheckItems } from '../../api/useChecklists';
import type { ChecklistEditorItem } from '../../model/ChecklistEditor';
import type { ChecklistDetail, ChecklistStage } from '../../model/checklistTypes';
import type { ChecklistDraft, ChecklistDraftInput } from '../../model/useChecklistDraft';
import ChecklistItemOrderList from './ChecklistItemOrderList';

import * as styles from './ChecklistEditor.styles';

type ChecklistEditorProps = {
  stage: ChecklistStage;
  draft: ChecklistDraft;
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string;
  onOpenItemPicker: () => void;
  onSubmit: (input: ChecklistDraftInput) => Promise<ChecklistDetail>;
  /** 데스크탑은 저장 버튼을 다른 화면처럼 파란 기본 버튼으로 두고, 화면 폭이 아니라 본문 열 아래에 붙인다. */
  isDesktop?: boolean;
};

/** 체크리스트 항목과 순서를 고치는 폼. 사용자마다 하나만 쓰므로 이름은 묻지 않는다. 항목 추가 화면은 `CheckItemPicker`가 맡는다. */
const ChecklistEditor = ({
  stage,
  draft,
  submitLabel,
  isSubmitting,
  serverError,
  onOpenItemPicker,
  onSubmit,
  isDesktop = false,
}: ChecklistEditorProps) => {
  const activeCatalog = useActiveCheckItems(stage);
  const activeSourceIds = useMemo(
    () => new Set(activeCatalog.data?.content.map((item) => item.checkItemId) ?? []),
    [activeCatalog.data],
  );
  const isInactive = (item: ChecklistEditorItem) =>
    item.origin === 'PROVIDED' && activeCatalog.isSuccess && !activeSourceIds.has(item.sourceCheckItemId);

  // 휴대폰은 화면 맨 아래에 고정하고, 데스크탑은 목록 아래 본문 열에 붙인다.
  const submitArea = (
    <BottomActionArea placement={isDesktop ? 'sticky' : 'screen'} divider={false}>
      <Button
        type="submit"
        variant={isDesktop ? 'primary' : 'soft'}
        fullWidth
        isLoading={isSubmitting}
        loadingLabel="저장 중…"
      >
        {submitLabel}
      </Button>
    </BottomActionArea>
  );

  return (
    <form
      className={`${styles.checklistEditor} ${styles.fixedSubmitEditor}`}
      onSubmit={(event) => {
        event.preventDefault();
        void draft.submit(onSubmit);
      }}
    >
      <AddItemAction disabled={isSubmitting} onClick={onOpenItemPicker}>
        체크 항목 추가
      </AddItemAction>

      {!isDesktop && submitArea}

      <p className={styles.editorSaveStatus} role="status" aria-live="polite">
        {draft.announcement}
      </p>
      {serverError !== undefined && (
        <p className="form-error" role="alert">
          {serverError} 작성한 내용은 그대로 유지됩니다. 같은 버튼으로 다시 시도할 수 있어요.
        </p>
      )}

      <section className={styles.editorSection} aria-labelledby="selected-items-heading">
        <div className={styles.sectionHeadingRow}>
          <div>
            <h2 id="selected-items-heading">확인 순서</h2>
          </div>
          <span className={styles.selectionCount}>{draft.items.length}개</span>
        </div>
        <p className="field-help">제공 항목을 원하는 확인 순서로 저장할 수 있어요.</p>
        {draft.items.length === 0 ? (
          <p className={styles.emptyItems}>체크 항목을 한 개 이상 추가해 주세요.</p>
        ) : (
          <ChecklistItemOrderList
            items={draft.items}
            isDisabled={isSubmitting}
            isInactive={isInactive}
            registerFocusTarget={draft.registerFocusTarget}
            onMove={draft.move}
            onReorder={draft.reorder}
            onRemove={draft.remove}
          />
        )}
        {draft.itemError !== null && (
          <p className="form-error" role="alert">
            {draft.itemError}
          </p>
        )}
      </section>
      {isDesktop && submitArea}
    </form>
  );
};

export default ChecklistEditor;
