import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getChecklistErrorMessage } from '../../features/checklist/api/checklistErrorMessages';
import ChecklistEditor from '../../features/checklist/ui/checklist-editor/ChecklistEditor';
import { Button } from '../../shared/ui/button/Button';
import TopNavigation from '../../shared/ui/top-navigation/TopNavigation';
import { USER_CHECKLIST_STAGE, checklistStageMeta } from '../../features/checklist/model/checklist';
import { useCreateChecklist } from '../../features/checklist/api/useChecklistMutations';
import { useChecklistPreset } from '../../features/checklist/api/useChecklists';
import useDelayedLoading from '../../shared/lib/hooks/useDelayedLoading';
import { checkItemToEditorItem } from '../../features/checklist/model/ChecklistEditor';
import type { ChecklistStage } from '../../features/checklist/model/checklistTypes';
import type { PublicConfig } from '../../shared/config/publicConfigTypes';
import { parseChecklistReturnTo } from '../../features/checklist/lib/checklist';
import { toProvidedChecklistItemInputs } from '../../features/checklist/lib/checklistEditor';
import { trackPostHogEvent } from '../../shared/lib/analytics/posthog';
import styles from './CreateChecklistPage.module.css';

/** 사용자 체크리스트는 현장 단계 하나뿐이라 단계 선택 화면 없이 바로 편집기로 들어간다. */
const CreateChecklistPage = ({ config }: { config: PublicConfig }) => {
  const [searchParams] = useSearchParams();
  return <ResolvedCreateChecklistPage config={config} returnTo={searchParams.get('returnTo')} />;
};

const stage: ChecklistStage = USER_CHECKLIST_STAGE;

const ResolvedCreateChecklistPage = ({ config, returnTo }: { config: PublicConfig; returnTo: string | null }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const safeReturn = parseChecklistReturnTo(returnTo);
  const preset = useChecklistPreset(config, stage, 'ONE_ROOM', true);
  const isPresetLoadingVisible = useDelayedLoading(preset.isPending);
  const isPresetLoading = preset.isPending || isPresetLoadingVisible;
  const create = useCreateChecklist(config);
  const isAddingItems = searchParams.get('mode') === 'add-items';

  useEffect(() => {
    trackPostHogEvent('checklist_creation_started', { stage });
  }, []);

  return (
    <main className={`${styles.page} property-page checklist-page checklist-editor-page`}>
      <div className={`${styles.container} page-container page-container--form`}>
        <TopNavigation
          className={styles.topNavigation}
          title={isAddingItems ? '체크 항목 편집' : '새 체크리스트'}
          backLabel={isAddingItems ? '새 체크리스트로 돌아가기' : '새 체크리스트 닫기'}
          navigationIcon={isAddingItems ? 'arrow-left' : 'close'}
          {...(isAddingItems
            ? {
                onBack: () => {
                  const next = new URLSearchParams(searchParams);
                  next.delete('mode');
                  setSearchParams(next, { replace: true });
                },
              }
            : { backTo: safeReturn?.path ?? '/checklists' })}
        />
        <h1 className="sr-only">새 체크리스트</h1>

        {isPresetLoading ? (
          isPresetLoadingVisible ? (
            <div className={styles.presetStatus} role="status">
              <span className="spinner" />
              프리셋을 불러오는 중이에요.
            </div>
          ) : null
        ) : preset.isError ? (
          <div className={styles.presetError} role="alert">
            <div>
              <strong>프리셋을 불러오지 못했어요.</strong>
              <span>{getChecklistErrorMessage(preset.error)}</span>
            </div>
            <Button variant="text" type="button" onClick={() => void preset.refetch()}>
              다시 시도
            </Button>
          </div>
        ) : (
          <ChecklistEditor
            config={config}
            stage={stage}
            initialName={`원룸 ${checklistStageMeta[stage].label} 체크리스트`}
            initialItems={(preset.data?.items ?? []).map(checkItemToEditorItem)}
            submitLabel="체크리스트 만들기"
            fixedSubmitAction
            isSubmitting={create.isPending}
            serverError={create.isError ? getChecklistErrorMessage(create.error) : undefined}
            viewMode={isAddingItems ? 'ADD_ITEMS' : 'EDIT'}
            onViewModeChange={(mode) => {
              const next = new URLSearchParams(searchParams);
              if (mode === 'ADD_ITEMS') next.set('mode', 'add-items');
              else next.delete('mode');
              setSearchParams(next, { replace: mode === 'EDIT' });
            }}
            onSubmit={async ({ name, items }) => {
              try {
                const created = await create.mutateAsync({
                  name,
                  stage,
                  items: toProvidedChecklistItemInputs(items),
                });
                trackPostHogEvent('checklist_created', { stage });
                if (safeReturn !== null && safeReturn.stage === stage) {
                  navigate(safeReturn.path, { replace: true, state: { newChecklistId: created.checklistId } });
                } else {
                  navigate('/checklists', { replace: true, state: { newChecklistId: created.checklistId } });
                }
                return created;
              } catch (error) {
                trackPostHogEvent('checklist_save_failed', {
                  stage,
                  error_kind: error instanceof Error ? 'request' : 'unknown',
                });
                throw error;
              }
            }}
          />
        )}
      </div>
    </main>
  );
};

export default CreateChecklistPage;
