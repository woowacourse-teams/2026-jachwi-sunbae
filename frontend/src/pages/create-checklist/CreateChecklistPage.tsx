import { type ReactNode, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getChecklistErrorMessage } from '@/features/checklist/api/checklistErrorMessages';
import { useCreateChecklist } from '@/features/checklist/api/useChecklistMutations';
import { useChecklistPreset } from '@/features/checklist/api/useChecklists';
import { type ChecklistReturnTarget, parseChecklistReturnTo } from '@/features/checklist/lib/checklist';
import { checklistStageMeta, USER_CHECKLIST_STAGE } from '@/features/checklist/model/checklist';
import type { ChecklistPresetItem, ChecklistStage } from '@/features/checklist/model/checklistTypes';
import useChecklistDraft, { type ChecklistDraftInput } from '@/features/checklist/model/useChecklistDraft';
import useChecklistItemPickerRoute from '@/features/checklist/model/useChecklistItemPickerRoute';
import CheckItemPicker from '@/features/checklist/ui/checklist-editor/CheckItemPicker';
import ChecklistEditor from '@/features/checklist/ui/checklist-editor/ChecklistEditor';
import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

import ChecklistPresetStatus from './ui/checklist-preset-status/ChecklistPresetStatus';

import styles from './CreateChecklistPage.module.css';

/** 사용자 체크리스트는 현장 단계 하나뿐이라 단계 선택 화면 없이 바로 편집기로 들어간다. */
const stage: ChecklistStage = USER_CHECKLIST_STAGE;

const CreateChecklistPage = () => {
  const [searchParams] = useSearchParams();
  const safeReturn = parseChecklistReturnTo(searchParams.get('returnTo'));
  const preset = useChecklistPreset(stage, 'ONE_ROOM', true);

  useEffect(() => {
    trackPostHogEvent('checklist_creation_started', { stage });
  }, []);

  if (!preset.isSuccess)
    return (
      <ChecklistEditorFrame>
        <NewChecklistNavigation returnPath={safeReturn?.path} />
        <ChecklistPresetStatus preset={preset} />
      </ChecklistEditorFrame>
    );

  return <CreateChecklistForm presetItems={preset.data.items} safeReturn={safeReturn} />;
};

type CreateChecklistFormProps = {
  presetItems: ChecklistPresetItem[];
  safeReturn: ChecklistReturnTarget | null;
};

const CreateChecklistForm = ({ presetItems, safeReturn }: CreateChecklistFormProps) => {
  const navigate = useNavigate();
  const create = useCreateChecklist();
  const { isPickerOpen, openPicker, closePicker } = useChecklistItemPickerRoute();
  const draft = useChecklistDraft({
    initialName: `${checklistStageMeta[stage].label} 체크리스트`,
    initialItems: presetItems,
    isSubmitting: create.isPending,
  });

  const save = async ({ name, items }: ChecklistDraftInput) => {
    try {
      trackPostHogEvent('checklist_creation_submitted', { stage });
      const created = await create.mutateAsync({ name, stage, items });
      trackPostHogEvent('checklist_created', { stage });
      const returnPath = safeReturn !== null && safeReturn.stage === stage ? safeReturn.path : '/checklists';
      navigate(returnPath, { replace: true, state: { newChecklistId: created.checklistId } });
      return created;
    } catch (error) {
      trackPostHogEvent('checklist_save_failed', {
        stage,
        error_kind: error instanceof Error ? 'request' : 'unknown',
      });
      throw error;
    }
  };

  if (isPickerOpen)
    return (
      <ChecklistEditorFrame>
        <TopNavigation
          className={styles.topNavigation}
          title="체크 항목 편집"
          backLabel="새 체크리스트로 돌아가기"
          navigationIcon="arrow-left"
          onBack={closePicker}
        />
        <CheckItemPicker
          stage={stage}
          existingSourceIds={draft.providedSourceIds}
          disabled={create.isPending}
          onCancel={closePicker}
          onAdd={(items) => {
            if (draft.addItems(items)) closePicker();
          }}
        />
      </ChecklistEditorFrame>
    );

  return (
    <ChecklistEditorFrame>
      <NewChecklistNavigation returnPath={safeReturn?.path} />
      <ChecklistEditor
        stage={stage}
        draft={draft}
        submitLabel="체크리스트 만들기"
        isSubmitting={create.isPending}
        serverError={create.isError ? getChecklistErrorMessage(create.error) : undefined}
        onOpenItemPicker={openPicker}
        onSubmit={save}
      />
    </ChecklistEditorFrame>
  );
};

const ChecklistEditorFrame = ({ children }: { children: ReactNode }) => (
  <main className={`${styles.page} property-page checklist-page checklist-editor-page`}>
    <div className={`${styles.container} page-container page-container--form`}>
      <h1 className="sr-only">새 체크리스트</h1>
      {children}
    </div>
  </main>
);

const NewChecklistNavigation = ({ returnPath = '/checklists' }: { returnPath?: string }) => (
  <TopNavigation
    className={styles.topNavigation}
    title="새 체크리스트"
    backLabel="새 체크리스트 닫기"
    navigationIcon="close"
    backTo={returnPath}
  />
);

export default CreateChecklistPage;
