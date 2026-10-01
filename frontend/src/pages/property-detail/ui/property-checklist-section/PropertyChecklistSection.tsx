import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAssignActiveChecklist } from '@/features/checklist/api/useChecklistMutations';
import { clearLastSelectedChecklist, readLastSelectedChecklist } from '@/features/checklist/model/lastChecklistStore';
import ChecklistProgressBar from '@/features/checklist/ui/checklist-progress-bar/ChecklistProgressBar';
import { usePropertyChecklistOverview } from '@/features/property/api/useProperties';
import { Button, ButtonLink } from '@/shared/ui/button/Button';
import DetailSection from '@/shared/ui/detail-section/DetailSection';
import Icon from '@/shared/ui/icon/Icon';

import styles from './PropertyChecklistSection.module.css';

type PropertyChecklistSectionProps = {
  propertyId: number;
};

const PropertyChecklistSection = ({ propertyId }: PropertyChecklistSectionProps) => {
  const navigate = useNavigate();
  const checklists = usePropertyChecklistOverview(propertyId);
  const assignDefaultChecklist = useAssignActiveChecklist(propertyId, 'ON_SITE');
  const assignmentStarted = useRef(false);
  const onSiteChecklist = checklists.data?.stages.find((item) => item.stage === 'ON_SITE');

  useEffect(() => {
    if (
      checklists.isPending ||
      checklists.isError ||
      checklists.data === undefined ||
      onSiteChecklist?.applied === true ||
      assignmentStarted.current
    ) {
      return;
    }

    assignmentStarted.current = true;
    const remembered = readLastSelectedChecklist();
    void assignDefaultChecklist.mutateAsync(remembered).catch(() => {
      if (remembered === 'SYSTEM_DEFAULT') return;
      clearLastSelectedChecklist();
      void assignDefaultChecklist.mutateAsync('SYSTEM_DEFAULT').catch(() => undefined);
    });
  }, [assignDefaultChecklist, checklists.data, checklists.isError, checklists.isPending, onSiteChecklist?.applied]);

  return (
    <>
      <DetailSection title="체크리스트">
        {onSiteChecklist !== undefined && onSiteChecklist.progress.totalCount > 0 && (
          <ChecklistProgressBar
            progress={onSiteChecklist.progress}
            trailing={
              <strong className={styles.count}>
                {onSiteChecklist.progress.completedCount}/{onSiteChecklist.progress.totalCount}
              </strong>
            }
          />
        )}
        {checklists.isError && (
          <button className={styles.retry} type="button" onClick={() => void checklists.refetch()}>
            체크리스트 정보를 불러오지 못했어요. 다시 시도
          </button>
        )}
        {assignDefaultChecklist.isError && (
          <p className={styles.retry}>체크리스트를 시작하지 못했어요. 다시 눌러 주세요.</p>
        )}
        {!checklists.isError &&
          (onSiteChecklist?.applied === true && onSiteChecklist.propertyChecklistId !== null ? (
            <ButtonLink
              className={styles.mainAction}
              variant="primary"
              fullWidth
              to={`/properties/${propertyId}/checklists/${onSiteChecklist.propertyChecklistId}`}
              state={{ from: 'property-detail' }}
            >
              체크리스트
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
          ) : (
            <Button
              className={styles.mainAction}
              variant="primary"
              fullWidth
              isLoading={assignDefaultChecklist.isPending}
              loadingLabel="준비 중…"
              onClick={() => {
                void assignDefaultChecklist
                  .mutateAsync('SYSTEM_DEFAULT')
                  .then((applied) => {
                    navigate(`/properties/${propertyId}/checklists/${applied.propertyChecklistId}`, {
                      replace: true,
                      state: { from: 'property-detail' },
                    });
                  })
                  .catch(() => undefined);
              }}
            >
              체크리스트
              <Icon name="arrow-right" size={16} />
            </Button>
          ))}
      </DetailSection>

      <div className={styles.contractSection}>
        <ButtonLink
          className={styles.contractAction}
          variant="secondary"
          fullWidth
          to={`/properties/${propertyId}/active-checklists/PRE_CONTRACT?from=property-detail`}
        >
          계약 시 체크리스트
          <Icon name="arrow-right" size={16} />
        </ButtonLink>
      </div>
    </>
  );
};

export default PropertyChecklistSection;
