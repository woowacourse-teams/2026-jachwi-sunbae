import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '../apis/apiClient';
import { getChecklistErrorMessage } from '../apis/checklistErrorMessages';
import ChecklistEditor from '../components/ChecklistEditor';
import TopNavigation from '../components/ui/TopNavigation';
import { useUpdateChecklist } from '../hooks/query/useChecklistMutations';
import { useChecklistDetail } from '../hooks/query/useChecklists';
import useDelayedLoading from '../hooks/ui/useDelayedLoading';
import { checklistItemToEditorItem } from '../types/ChecklistEditor';
import type { PublicConfig } from '../types/PublicConfig';
import { toChecklistItemInputs } from '../utils/checklistEditor';
import { parsePositiveId } from '../utils/propertyFormat';
import styles from './ChecklistDetailPage.module.css';
import ContentState from '../components/ui/ContentState';

const ChecklistDetailPage = ({ config }: { config: PublicConfig }) => {
  const checklistId = parsePositiveId(useParams().resource);
  if (checklistId === null) return <InvalidChecklist />;
  return <ResolvedChecklistDetail config={config} checklistId={checklistId} />;
};

const InvalidChecklist = () => (
  <main className="property-page">
    <div className="page-container">
      <ContentState page={false} title="올바른 체크리스트 주소가 아니에요.">
        <Link to="/checklists">내 체크리스트로 돌아가기</Link>
      </ContentState>
    </div>
  </main>
);

const ResolvedChecklistDetail = ({ config, checklistId }: { config: PublicConfig; checklistId: number }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const detail = useChecklistDetail(config, checklistId);
  const isLoadingVisible = useDelayedLoading(detail.isPending);
  const isLoading = detail.isPending || isLoadingVisible;
  const update = useUpdateChecklist(config, checklistId);
  if (isLoading)
    return (
      <main className="property-page">
        <div className="page-container">
          {isLoadingVisible && <ContentState page={false} loading title="체크리스트를 불러오는 중이에요." />}
        </div>
      </main>
    );
  if (detail.isError) {
    const notFound = detail.error instanceof ApiError && detail.error.code === 'CHECKLIST_NOT_FOUND';
    return (
      <main className="property-page">
        <div className="page-container">
          <ContentState
            page={false}
            tone="error"
            title={notFound ? '체크리스트를 찾을 수 없어요.' : '체크리스트를 불러오지 못했어요.'}
            description={getChecklistErrorMessage(detail.error)}
            onRetry={notFound ? undefined : () => void detail.refetch()}
          >
            <Link to="/checklists">내 체크리스트로 돌아가기</Link>
          </ContentState>
        </div>
      </main>
    );
  }

  const checklist = detail.data;
  const isAddingItems = searchParams.get('mode') === 'add-items';
  return (
    <main className={`property-page checklist-page checklist-editor-page ${styles.page}`}>
      <div className={`page-container page-container--form ${styles.container}`}>
        <TopNavigation
          className={styles.topNavigation}
          title={isAddingItems ? '체크 항목 편집' : checklist.name}
          backLabel={isAddingItems ? '체크리스트 편집으로 돌아가기' : '체크리스트 목록으로 돌아가기'}
          navigationIcon="arrow-left"
          {...(isAddingItems ? { onBack: () => setSearchParams({}, { replace: true }) } : { backTo: '/checklists' })}
        />
        <h1 className="sr-only">{checklist.name}</h1>
        <ChecklistEditor
          key={checklist.checklistId}
          config={config}
          stage={checklist.stage}
          initialName={checklist.name}
          initialItems={checklist.items.map(checklistItemToEditorItem)}
          submitLabel="변경 내용 저장"
          fixedSubmitAction
          isSubmitting={update.isPending}
          serverError={update.isError ? getChecklistErrorMessage(update.error) : undefined}
          viewMode={isAddingItems ? 'ADD_ITEMS' : 'EDIT'}
          onViewModeChange={(mode) =>
            setSearchParams(mode === 'ADD_ITEMS' ? { mode: 'add-items' } : {}, { replace: mode === 'EDIT' })
          }
          onSubmit={async ({ name, items }) => {
            const saved = await update.mutateAsync({ name, items: toChecklistItemInputs(items) });
            navigate('/checklists', { replace: true, state: { focusHeading: true } });
            return saved;
          }}
        />
      </div>
    </main>
  );
};

export default ChecklistDetailPage;
