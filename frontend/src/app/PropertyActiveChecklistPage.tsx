import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '../apis/apiClient';
import { getChecklistErrorMessage } from '../apis/checklistErrorMessages';
import ChecklistPageLayout from '../components/ChecklistPageLayout';
import ContentState from '../components/ui/ContentState';
import SelectionControl from '../components/ui/SelectionControl';
import BottomActionArea from '../components/ui/BottomActionArea';
import { Button } from '../components/ui/Button';
import { isChecklistStage } from '../constants/checklist';
import { useAssignActiveChecklist } from '../hooks/query/useChecklistMutations';
import { useChecklistList } from '../hooks/query/useChecklists';
import { usePropertyChecklistOverview, usePropertyDetail } from '../hooks/query/useProperties';
import useDelayedLoading from '../hooks/ui/useDelayedLoading';
import type { ChecklistStage } from '../types/Checklist';
import type { PublicConfig } from '../types/PublicConfig';
import { parsePositiveId } from '../utils/propertyFormat';
import styles from './PropertyActiveChecklistPage.module.css';
import {
  clearLastSelectedChecklist,
  readLastSelectedChecklist,
  writeLastSelectedChecklist,
} from './lastChecklistStore';

const readNewChecklistId = (state: unknown): number | null => {
  if (typeof state !== 'object' || state === null || !('newChecklistId' in state)) return null;
  const value = state.newChecklistId;
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
};

const isFromPropertyDetail = (state: unknown) =>
  typeof state === 'object' && state !== null && 'from' in state && state.from === 'property-detail';

const PropertyActiveChecklistPage = ({ config }: { config: PublicConfig }) => {
  const params = useParams();
  const propertyId = parsePositiveId(params.propertyId);
  if (propertyId === null || !isChecklistStage(params.stage)) return <InvalidActiveChecklist />;
  return (
    <ResolvedPropertyActiveChecklist key={params.stage} config={config} propertyId={propertyId} stage={params.stage} />
  );
};

const InvalidActiveChecklist = () => (
  <main className="property-page">
    <div className="page-container">
      <ContentState page={false} title="올바른 매물 체크리스트 주소가 아니에요.">
        <Link to="/properties">매물 목록으로 돌아가기</Link>
      </ContentState>
    </div>
  </main>
);

const ResolvedPropertyActiveChecklist = ({
  config,
  propertyId,
  stage,
}: {
  config: PublicConfig;
  propertyId: number;
  stage: ChecklistStage;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const property = usePropertyDetail(config, propertyId);
  const overview = usePropertyChecklistOverview(config, propertyId);
  const list = useChecklistList(config, stage);
  const assign = useAssignActiveChecklist(config, propertyId, stage);
  const defaultAssignmentStarted = useRef(false);
  const isPending = property.isPending || overview.isPending || list.isPending;
  const isLoadingVisible = useDelayedLoading(isPending);
  const isLoading = isPending || isLoadingVisible;
  const newlyCreatedId = readNewChecklistId(location.state);
  const fromPropertyDetail = isFromPropertyDetail(location.state) || searchParams.get('from') === 'property-detail';
  const isReplacing = searchParams.get('mode') === 'replace';
  const overviewStage = overview.data?.stages.find((item) => item.stage === stage);
  const current =
    overviewStage?.applied === true && overviewStage.checklistName !== null
      ? {
          checklistId: overviewStage.sourceChecklistId ?? -1,
          name: overviewStage.checklistName,
        }
      : null;
  const [selectedId, setSelectedId] = useState<number | null>(newlyCreatedId);
  const items = useMemo(() => list.data?.pages.flatMap((page) => page.content) ?? [], [list.data]);

  useEffect(() => {
    if (
      fromPropertyDetail &&
      !isReplacing &&
      overviewStage?.applied === true &&
      overviewStage.propertyChecklistId !== null
    ) {
      navigate(`/properties/${propertyId}/checklists/${overviewStage.propertyChecklistId}`, {
        replace: true,
        state: { from: 'property-detail' },
      });
    }
  }, [
    fromPropertyDetail,
    isReplacing,
    navigate,
    overviewStage?.applied,
    overviewStage?.propertyChecklistId,
    propertyId,
  ]);

  useEffect(() => {
    if (
      isReplacing ||
      overview.isPending ||
      overview.isError ||
      overviewStage?.applied === true ||
      defaultAssignmentStarted.current
    ) {
      return;
    }

    defaultAssignmentStarted.current = true;
    const openApplied = (applied: { propertyChecklistId: number }) => {
      navigate(`/properties/${propertyId}/checklists/${applied.propertyChecklistId}`, {
        replace: true,
        ...(fromPropertyDetail ? { state: { from: 'property-detail' } } : {}),
      });
    };
    // 마지막으로 고른 체크리스트로 시작하고, 그 목록이 사라졌으면 제공 템플릿으로 되돌린다.
    const remembered = readLastSelectedChecklist();
    void assign
      .mutateAsync(remembered)
      .then(openApplied)
      .catch(() => {
        if (remembered === 'SYSTEM_DEFAULT') {
          defaultAssignmentStarted.current = false;
          return;
        }
        clearLastSelectedChecklist();
        void assign
          .mutateAsync('SYSTEM_DEFAULT')
          .then(openApplied)
          .catch(() => {
            defaultAssignmentStarted.current = false;
          });
      });
  }, [
    assign,
    fromPropertyDetail,
    isReplacing,
    navigate,
    overview.isError,
    overview.isPending,
    overviewStage?.applied,
    propertyId,
  ]);

  useEffect(() => {
    if (selectedId === null && current !== null) setSelectedId(current.checklistId);
  }, [current, selectedId]);

  if (isLoading)
    return (
      <main className="property-page">
        <div className="page-container">
          {isLoadingVisible && <ContentState page={false} loading title="체크리스트를 불러오는 중이에요." />}
        </div>
      </main>
    );

  if (property.isError || overview.isError || list.isError) {
    const error = property.error ?? overview.error ?? list.error;
    const propertyNotFound = error instanceof ApiError && error.code === 'PROPERTY_NOT_FOUND';
    return (
      <main className="property-page">
        <div className="page-container">
          <ContentState
            page={false}
            tone="error"
            title={propertyNotFound ? '매물을 찾을 수 없어요.' : '체크리스트를 불러오지 못했어요.'}
            description={getChecklistErrorMessage(error)}
            onRetry={
              propertyNotFound
                ? undefined
                : () => {
                    void property.refetch();
                    void overview.refetch();
                    void list.refetch();
                  }
            }
          >
            <Link to="/properties">매물 목록으로 돌아가기</Link>
          </ContentState>
        </div>
      </main>
    );
  }

  const selectionChanged = selectedId !== null && selectedId !== current?.checklistId;

  const saveSelection = async () => {
    if (selectedId === null) return;
    const selection = selectedId === -1 ? ('SYSTEM_DEFAULT' as const) : selectedId;
    try {
      const applied = await assign.mutateAsync(selection);
      // 다음 매물은 이번에 고른 목록으로 시작한다.
      writeLastSelectedChecklist(selection);
      navigate(`/properties/${propertyId}/checklists/${applied.propertyChecklistId}`, {
        replace: true,
        ...(fromPropertyDetail ? { state: { from: 'property-detail' } } : {}),
      });
    } catch {
      /* Keep the selected checklist visible for retry. */
    }
  };

  const toggleSelection = (checklistId: number) => {
    if (current?.checklistId === checklistId && typeof overviewStage?.propertyChecklistId === 'number') {
      navigate(`/properties/${propertyId}/checklists/${overviewStage.propertyChecklistId}`, {
        ...(fromPropertyDetail ? { state: { from: 'property-detail' } } : {}),
      });
      return;
    }
    setSelectedId(checklistId);
  };

  return (
    <ChecklistPageLayout
      title="체크리스트 교체"
      backTo={`/properties/${propertyId}`}
      backLabel="매물 상세로 돌아가기"
      className={`${styles.page} property-page checklist-page active-checklist-page`}
      containerClassName="page-container checklist-page__narrow"
    >
      <h1 className="sr-only">{property.data.name} 체크리스트 교체</h1>

      <p className={styles.description}>이 매물에 적용할 체크리스트를 선택해요.</p>

      <fieldset className="active-checklist-options">
        <legend className="sr-only">적용할 체크리스트</legend>
        <SelectionControl
          className={selectedId === -1 ? 'is-selected' : undefined}
          name="active-checklist"
          value="SYSTEM_DEFAULT"
          checked={selectedId === -1}
          disabled={assign.isPending}
          markClassName={styles.selectionMark}
          onSelect={() => toggleSelection(-1)}
        >
          <span>
            <strong>자취선배 기본 체크리스트</strong>
            <small>이 단계의 필수 항목으로 바로 시작</small>
          </span>
          <em>추천</em>
        </SelectionControl>
        {items.map((item) => (
          <SelectionControl
            key={item.checklistId}
            className={selectedId === item.checklistId ? 'is-selected' : undefined}
            name="active-checklist"
            value={String(item.checklistId)}
            checked={selectedId === item.checklistId}
            disabled={assign.isPending}
            markClassName={styles.selectionMark}
            onSelect={() => toggleSelection(item.checklistId)}
          >
            <span>
              <strong>{item.name}</strong>
              <small>
                {item.itemCount}개 항목 · 매물 {item.assignedPropertyCount}곳에서 사용
              </small>
            </span>
            {newlyCreatedId === item.checklistId && <em>방금 생성</em>}
          </SelectionControl>
        ))}
      </fieldset>

      {list.hasNextPage && (
        <div className={styles.loadMore}>
          {list.isFetchNextPageError && (
            <p role="alert">추가 목록을 불러오지 못했어요. 기존 선택지는 그대로 유지됩니다.</p>
          )}
          <Button
            variant="secondary"
            fullWidth
            type="button"
            disabled={list.isFetchingNextPage}
            onClick={() => void list.fetchNextPage()}
          >
            {list.isFetchingNextPage
              ? '불러오는 중…'
              : list.isFetchNextPageError
                ? '다시 불러오기'
                : '체크리스트 더 보기'}
          </Button>
        </div>
      )}
      {selectionChanged && current !== null && (
        <p className="form-notice">확인하면 현재 체크리스트가 선택한 체크리스트로 바뀝니다.</p>
      )}
      {assign.isError && (
        <p className="form-error" role="alert">
          {getChecklistErrorMessage(assign.error)} 기존 연결은 유지됩니다.
        </p>
      )}
      {selectedId !== null && selectionChanged && (
        <div className={styles.bottomAction}>
          <BottomActionArea divider={false}>
            <Button
              variant="soft"
              fullWidth
              isLoading={assign.isPending}
              loadingLabel="변경 중…"
              type="button"
              disabled={assign.isPending}
              onClick={() => void saveSelection()}
            >
              {current === null ? '체크리스트 적용' : '선택한 체크리스트로 교체'}
            </Button>
          </BottomActionArea>
        </div>
      )}
    </ChecklistPageLayout>
  );
};

export default PropertyActiveChecklistPage;
