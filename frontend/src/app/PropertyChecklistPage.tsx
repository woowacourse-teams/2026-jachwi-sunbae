import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../apis/apiClient';
import ChecklistPageLayout from '../components/ChecklistPageLayout';
import ContentState from '../components/ui/ContentState';
import PropertyChecklistItemControl from '../components/PropertyChecklistItemControl';
import Icon from '../components/ui/Icon';
import IconButton from '../components/ui/IconButton';
import { usePropertyChecklistDetail, usePropertyDetail } from '../hooks/query/useProperties';

import useDelayedLoading from '../hooks/ui/useDelayedLoading';
import type { PublicConfig } from '../types/PublicConfig';
import { USER_CHECKLIST_STAGE } from '../constants/checklist';
import { getChecklistStageLabel, parsePositiveId } from '../utils/propertyFormat';
import styles from './PropertyChecklistPage.module.css';

const PropertyChecklistPage = ({ config }: { config: PublicConfig }) => {
  const params = useParams();
  const propertyId = parsePositiveId(params.propertyId);
  const propertyChecklistId = parsePositiveId(params.propertyChecklistId);

  if (propertyId === null || propertyChecklistId === null) {
    return (
      <main className="property-page">
        <ContentState page={false} title="올바른 매물 체크리스트 주소가 아니에요.">
          <Link to="/properties">매물 목록으로 돌아가기</Link>
        </ContentState>
      </main>
    );
  }

  return (
    <ResolvedPropertyChecklistPage
      key={propertyChecklistId}
      config={config}
      propertyId={propertyId}
      propertyChecklistId={propertyChecklistId}
    />
  );
};

const ResolvedPropertyChecklistPage = ({
  config,
  propertyId,
  propertyChecklistId,
}: {
  config: PublicConfig;
  propertyId: number;
  propertyChecklistId: number;
}) => {
  const checklist = usePropertyChecklistDetail(config, propertyId, propertyChecklistId);
  const isLoadingVisible = useDelayedLoading(checklist.isPending);
  const isLoading = checklist.isPending || isLoadingVisible;
  const property = usePropertyDetail(config, propertyId);

  if (isLoading) {
    return isLoadingVisible ? <ContentState page={false} loading title="체크리스트를 불러오는 중이에요." /> : null;
  }

  if (checklist.isError) {
    const isNotFound = checklist.error instanceof ApiError && checklist.error.code === 'PROPERTY_CHECKLIST_NOT_FOUND';
    return (
      <main className="property-page">
        <ContentState
          page={false}
          tone="error"
          title={isNotFound ? '연결된 체크리스트를 찾을 수 없어요.' : '체크리스트를 불러오지 못했어요.'}
          onRetry={isNotFound ? undefined : () => void checklist.refetch()}
        >
          <Link to={`/properties/${propertyId}`}>매물 상세로 돌아가기</Link>
        </ContentState>
      </main>
    );
  }

  const detail = checklist.data;
  const completedCount = detail.items.filter((item) => item.status !== 'UNCONFIRMED').length;

  return (
    <ChecklistPageLayout
      title={property.data === undefined ? '매물 체크리스트' : `${property.data.name} 체크리스트`}
      backTo={`/properties/${propertyId}`}
      backLabel="매물 상세로 돌아가기"
      endSlot={
        <>
          {detail.stage === USER_CHECKLIST_STAGE && (
            <Link
              className={styles.editAction}
              to={`/properties/${propertyId}/active-checklists/${detail.stage}?mode=replace`}
            >
              편집
            </Link>
          )}
          {detail.sourceChecklistId !== null && (
            <IconButton label="체크리스트 항목 편집" to={`/checklists/${detail.sourceChecklistId}`}>
              <Icon name="edit" size={16} />
            </IconButton>
          )}
        </>
      }
    >
      <header className={styles.heading}>
        <div>
          <span>{getChecklistStageLabel(detail.stage)}</span>
          <h1>{detail.checklistName}</h1>
        </div>
        <div className={styles.actions}>
          <strong>
            {completedCount}/{detail.items.length}
          </strong>
        </div>
      </header>
      <ol className={styles.items}>
        {detail.items.map((item) => (
          <PropertyChecklistItemControl
            key={item.itemId}
            config={config}
            propertyId={propertyId}
            propertyChecklistId={propertyChecklistId}
            item={item}
          />
        ))}
      </ol>

      <div className={styles.saveAction}>
        <Link to={`/properties/${propertyId}`}>저장</Link>
      </div>
    </ChecklistPageLayout>
  );
};

export default PropertyChecklistPage;
