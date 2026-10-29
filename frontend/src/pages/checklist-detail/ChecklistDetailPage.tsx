import { css } from '@emotion/css';
import type { ReactNode } from 'react';

import { describeChecklistLoadError, getChecklistErrorMessage } from '@/features/checklist/api/checklistErrorMessages';
import { useUpdateChecklist } from '@/features/checklist/api/useChecklistMutations';
import { useChecklistDetail } from '@/features/checklist/api/useChecklists';
import type { ChecklistDetail } from '@/features/checklist/model/checklistTypes';
import { writeLastSelectedChecklist } from '@/features/checklist/model/lastChecklistStore';
import useChecklistDraft, { type ChecklistDraftInput } from '@/features/checklist/model/useChecklistDraft';
import useChecklistItemPickerRoute from '@/features/checklist/model/useChecklistItemPickerRoute';
import CheckItemPicker from '@/features/checklist/ui/checklist-editor/CheckItemPicker';
import ChecklistEditor from '@/features/checklist/ui/checklist-editor/ChecklistEditor';
import useReturnNavigation from '@/shared/lib/navigation/useReturnNavigation';
import QueryState from '@/shared/ui/query-state/QueryState';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

const describeError = describeChecklistLoadError('체크리스트를 불러오지 못했어요.', {
  CHECKLIST_NOT_FOUND: '체크리스트를 찾을 수 없어요.',
});

/** 사용자의 하나뿐인 체크리스트를 고치는 화면. `/checklists`가 열어 준다. */
const ChecklistDetailPage = ({ checklistId }: { checklistId: number }) => {
  const detail = useChecklistDetail(checklistId);

  return (
    <QueryState query={detail} loadingTitle="체크리스트를 불러오는 중이에요." describeError={describeError}>
      {(checklist) => <ChecklistDetailView key={checklist.checklistId} checklist={checklist} />}
    </QueryState>
  );
};

const ChecklistDetailView = ({ checklist }: { checklist: ChecklistDetail }) => {
  const update = useUpdateChecklist(checklist.checklistId);
  const goBack = useReturnNavigation({ cameFromTarget: true, fallback: '/' });
  const { isPickerOpen, openPicker, closePicker } = useChecklistItemPickerRoute();
  const draft = useChecklistDraft({
    initialName: checklist.name,
    initialItems: checklist.items,
    isSubmitting: update.isPending,
  });

  const save = async ({ name, items }: ChecklistDraftInput) => {
    const saved = await update.mutateAsync({ name, items });
    // 새 매물에도 이 체크리스트가 바로 적용되도록 기억한다.
    writeLastSelectedChecklist(saved.checklistId);
    goBack();
    return saved;
  };

  if (isPickerOpen)
    return (
      <ChecklistEditorFrame>
        <TopNavigation
          className={styles.topNavigation}
          title="체크 항목 편집"
          backLabel="체크리스트 편집으로 돌아가기"
          navigationIcon="arrow-left"
          onBack={closePicker}
        />
        <CheckItemPicker
          stage={checklist.stage}
          existingSourceIds={draft.providedSourceIds}
          disabled={update.isPending}
          onCancel={closePicker}
          onAdd={(items) => {
            if (draft.addItems(items)) closePicker();
          }}
        />
      </ChecklistEditorFrame>
    );

  return (
    <ChecklistEditorFrame>
      <TopNavigation
        className={styles.topNavigation}
        title="체크리스트 편집"
        backLabel="이전 화면으로 돌아가기"
        navigationIcon="arrow-left"
        onBack={goBack}
      />
      <ChecklistEditor
        stage={checklist.stage}
        draft={draft}
        submitLabel="변경 내용 저장"
        isSubmitting={update.isPending}
        serverError={update.isError ? getChecklistErrorMessage(update.error) : undefined}
        onOpenItemPicker={openPicker}
        onSubmit={save}
      />
    </ChecklistEditorFrame>
  );
};

const ChecklistEditorFrame = ({ children }: { children: ReactNode }) => (
  <main className={`property-page checklist-page checklist-editor-page ${styles.page}`}>
    <div className={styles.container}>{children}</div>
  </main>
);

const styles = {
  page: css`
    label: ChecklistDetailPage-page;
    padding-right: 1rem;
    padding-left: 1rem;
    background: var(--color-canvas);
  `,

  /* 휴대폰은 앱 열의 가로 폭을 그대로 쓰고, 데스크탑은 항목 줄이 너무 길어지지 않게 가운데 좁은 열에 둔다. */
  container: css`
    label: ChecklistDetailPage-container;
    width: 100%;

    @media (min-width: 768px) {
      max-width: 34rem;
      margin-right: auto;
      margin-left: auto;
    }
  `,

  topNavigation: css`
    label: ChecklistDetailPage-topNavigation;
    margin-bottom: 0;
  `,
};

export default ChecklistDetailPage;
