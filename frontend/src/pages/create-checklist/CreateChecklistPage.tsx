import { css } from '@emotion/css';
import { type ReactNode, useEffect } from 'react';

import { getChecklistErrorMessage } from '@/features/checklist/api/checklistErrorMessages';
import { useCreateChecklist } from '@/features/checklist/api/useChecklistMutations';
import { useChecklistPreset } from '@/features/checklist/api/useChecklists';
import { USER_CHECKLIST_STAGE } from '@/features/checklist/model/checklist';
import type { ChecklistPresetItem, ChecklistStage } from '@/features/checklist/model/checklistTypes';
import { writeLastSelectedChecklist } from '@/features/checklist/model/lastChecklistStore';
import useChecklistDraft, { type ChecklistDraftInput } from '@/features/checklist/model/useChecklistDraft';
import useChecklistItemPickerRoute from '@/features/checklist/model/useChecklistItemPickerRoute';
import CheckItemPicker from '@/features/checklist/ui/checklist-editor/CheckItemPicker';
import ChecklistEditor from '@/features/checklist/ui/checklist-editor/ChecklistEditor';
import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';
import useReturnNavigation from '@/shared/lib/navigation/useReturnNavigation';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

import ChecklistPresetStatus from './ui/checklist-preset-status/ChecklistPresetStatus';

/** 사용자 체크리스트는 현장 단계 하나뿐이라 단계 선택 화면 없이 바로 편집기로 들어간다. */
const stage: ChecklistStage = USER_CHECKLIST_STAGE;
/** 사용자마다 하나만 쓰므로 이름을 묻지 않고 이 이름으로 만든다. */
const MY_CHECKLIST_NAME = '내 체크리스트';

/** 아직 체크리스트가 없는 사용자에게 기본 항목으로 채운 편집 화면을 연다. `/checklists`가 열어 준다. */
const CreateChecklistPage = () => {
  const goBack = useReturnNavigation({ cameFromTarget: true, fallback: '/' });
  const preset = useChecklistPreset(stage, 'ONE_ROOM', true);

  useEffect(() => {
    trackPostHogEvent('checklist_creation_started', { stage });
  }, []);

  if (!preset.isSuccess)
    return (
      <ChecklistEditorFrame>
        <ChecklistEditNavigation onBack={goBack} />
        <ChecklistPresetStatus preset={preset} />
      </ChecklistEditorFrame>
    );

  return <CreateChecklistForm presetItems={preset.data.items} />;
};

const CreateChecklistForm = ({ presetItems }: { presetItems: ChecklistPresetItem[] }) => {
  const goBack = useReturnNavigation({ cameFromTarget: true, fallback: '/' });
  const create = useCreateChecklist();
  const { isPickerOpen, openPicker, closePicker } = useChecklistItemPickerRoute();
  const draft = useChecklistDraft({
    initialName: MY_CHECKLIST_NAME,
    initialItems: presetItems,
    isSubmitting: create.isPending,
  });

  const save = async ({ name, items }: ChecklistDraftInput) => {
    try {
      trackPostHogEvent('checklist_creation_submitted', { stage });
      const created = await create.mutateAsync({ name, stage, items });
      trackPostHogEvent('checklist_created', { stage });
      // 새 매물에도 이 체크리스트가 바로 적용되도록 기억한다.
      writeLastSelectedChecklist(created.checklistId);
      goBack();
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
          backLabel="체크리스트 편집으로 돌아가기"
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
      <ChecklistEditNavigation onBack={goBack} />
      <ChecklistEditor
        stage={stage}
        draft={draft}
        submitLabel="체크리스트 저장"
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
    <div className={styles.container}>{children}</div>
  </main>
);

const ChecklistEditNavigation = ({ onBack }: { onBack: () => void }) => (
  <TopNavigation
    className={styles.topNavigation}
    title="체크리스트 편집"
    backLabel="이전 화면으로 돌아가기"
    navigationIcon="arrow-left"
    onBack={onBack}
  />
);

const styles = {
  page: css`
    label: CreateChecklistPage-page;
    background: var(--color-canvas);
  `,

  topNavigation: css`
    label: CreateChecklistPage-topNavigation;
    margin-bottom: 0;
  `,

  /* 휴대폰은 앱 열의 가로 폭을 그대로 쓰고, 데스크탑은 항목 줄이 너무 길어지지 않게 가운데 좁은 열에 둔다. */
  container: css`
    label: CreateChecklistPage-container;
    width: 100%;

    @media (min-width: 768px) {
      max-width: 34rem;
      margin-right: auto;
      margin-left: auto;
    }

    & > [data-full-bleed='true'] {
      margin-top: -0.15rem;
    }
  `,
};

export default CreateChecklistPage;
