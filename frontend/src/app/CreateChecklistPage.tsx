import { useNavigate, useSearchParams } from 'react-router-dom';

import { getChecklistErrorMessage } from '../apis/checklistErrorMessages';
import ChecklistEditor from '../components/ChecklistEditor';
import { Button } from '../components/ui/Button';
import TopNavigation from '../components/ui/TopNavigation';
import { USER_CHECKLIST_STAGE, checklistStageMeta } from '../constants/checklist';
import { useCreateChecklist } from '../hooks/query/useChecklistMutations';
import { useChecklistPreset } from '../hooks/query/useChecklists';
import useDelayedLoading from '../hooks/ui/useDelayedLoading';
import { checkItemToEditorItem } from '../types/ChecklistEditor';
import type { ChecklistStage } from '../types/Checklist';
import type { PublicConfig } from '../types/PublicConfig';
import { parseChecklistReturnTo } from '../utils/checklist';
import { toProvidedChecklistItemInputs } from '../utils/checklistEditor';
import { trackPostHogEvent } from '../utils/posthog';
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
            }}
          />
        )}
      </div>
    </main>
  );
};

export default CreateChecklistPage;
