import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { describeChecklistLoadError, getChecklistErrorMessage } from '@/features/checklist/api/checklistErrorMessages';
import { useUpdateChecklist } from '@/features/checklist/api/useChecklistMutations';
import { useChecklistDetail } from '@/features/checklist/api/useChecklists';
import type { ChecklistDetail } from '@/features/checklist/model/checklistTypes';
import useChecklistDraft, { type ChecklistDraftInput } from '@/features/checklist/model/useChecklistDraft';
import useChecklistItemPickerRoute from '@/features/checklist/model/useChecklistItemPickerRoute';
import CheckItemPicker from '@/features/checklist/ui/checklist-editor/CheckItemPicker';
import ChecklistEditor from '@/features/checklist/ui/checklist-editor/ChecklistEditor';
import { parsePositiveId } from '@/features/property/lib/propertyFormat';
import ContentState from '@/shared/ui/content-state/ContentState';
import QueryState from '@/shared/ui/query-state/QueryState';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

import styles from './ChecklistDetailPage.module.css';

const backToList = <Link to="/checklists">내 체크리스트로 돌아가기</Link>;
const describeError = describeChecklistLoadError('체크리스트를 불러오지 못했어요.', {
  CHECKLIST_NOT_FOUND: '체크리스트를 찾을 수 없어요.',
});

const ChecklistDetailPage = () => {
  const checklistId = parsePositiveId(useParams().resource);
  if (checklistId === null) return <ContentState title="올바른 체크리스트 주소가 아니에요.">{backToList}</ContentState>;
  return <ResolvedChecklistDetail checklistId={checklistId} />;
};

const ResolvedChecklistDetail = ({ checklistId }: { checklistId: number }) => {
  const detail = useChecklistDetail(checklistId);

  return (
    <QueryState
      query={detail}
      loadingTitle="체크리스트를 불러오는 중이에요."
      describeError={describeError}
      errorAction={backToList}
    >
      {(checklist) => <ChecklistDetailView key={checklist.checklistId} checklist={checklist} />}
    </QueryState>
  );
};

const ChecklistDetailView = ({ checklist }: { checklist: ChecklistDetail }) => {
  const navigate = useNavigate();
  const update = useUpdateChecklist(checklist.checklistId);
  const { isPickerOpen, openPicker, closePicker } = useChecklistItemPickerRoute();
  const draft = useChecklistDraft({
    initialName: checklist.name,
    initialItems: checklist.items,
    isSubmitting: update.isPending,
  });

  const save = async ({ name, items }: ChecklistDraftInput) => {
    const saved = await update.mutateAsync({ name, items });
    navigate('/checklists', { replace: true, state: { focusHeading: true } });
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
        <h1 className="sr-only">{checklist.name}</h1>
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
        title={checklist.name}
        backLabel="체크리스트 목록으로 돌아가기"
        navigationIcon="arrow-left"
        backTo="/checklists"
      />
      <h1 className="sr-only">{checklist.name}</h1>
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
    <div className={`page-container page-container--form ${styles.container}`}>{children}</div>
  </main>
);

export default ChecklistDetailPage;
