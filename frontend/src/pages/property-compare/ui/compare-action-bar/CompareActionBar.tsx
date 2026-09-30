import { Button } from '@/shared/ui/button/Button';

import { MIN_SELECTION } from '../../hooks/usePropertyComparison';

import styles from './CompareActionBar.module.css';

type CompareActionBarProps = {
  selectedCount: number;
  isExporting: boolean;
  onDownload: () => void;
};

const CompareActionBar = ({ selectedCount, isExporting, onDownload }: CompareActionBarProps) => (
  <div className={styles.actionBar}>
    <p>
      {selectedCount < MIN_SELECTION
        ? `${MIN_SELECTION - selectedCount}개 더 선택해 주세요.`
        : `${selectedCount}개 매물의 모든 기록을 PDF로 만들어요.`}
    </p>
    <Button
      fullWidth
      disabled={selectedCount < MIN_SELECTION}
      isLoading={isExporting}
      loadingLabel="PDF 만드는 중…"
      onClick={onDownload}
    >
      선택한 {selectedCount}개 PDF 받기
    </Button>
  </div>
);

export default CompareActionBar;
