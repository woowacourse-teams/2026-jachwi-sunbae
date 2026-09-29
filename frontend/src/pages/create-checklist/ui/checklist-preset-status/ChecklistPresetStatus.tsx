import { getChecklistErrorMessage } from '@/features/checklist/api/checklistErrorMessages';
import type { useChecklistPreset } from '@/features/checklist/api/useChecklists';
import useDelayedLoading from '@/shared/lib/hooks/useDelayedLoading';
import { Button } from '@/shared/ui/button/Button';

import styles from '../../CreateChecklistPage.module.css';

type ChecklistPresetStatusProps = {
  preset: ReturnType<typeof useChecklistPreset>;
};

/** 프리셋을 불러오는 중이거나 실패했을 때 편집기 대신 보여 준다. */
const ChecklistPresetStatus = ({ preset }: ChecklistPresetStatusProps) => {
  const isLoadingVisible = useDelayedLoading(preset.isPending);

  if (preset.isError) {
    return (
      <div className={styles.presetError} role="alert">
        <div>
          <strong>프리셋을 불러오지 못했어요.</strong>
          <span>{getChecklistErrorMessage(preset.error)}</span>
        </div>
        <Button variant="text" type="button" onClick={() => void preset.refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return isLoadingVisible ? (
    <div className={styles.presetStatus} role="status">
      <span className="spinner" />
      프리셋을 불러오는 중이에요.
    </div>
  ) : null;
};

export default ChecklistPresetStatus;
