import type { CSSProperties } from 'react';

import type { MapCategory } from '@/features/map/model/Map';
import MapCategoryRail from '@/features/map/ui/map-category-rail/MapCategoryRail';
import MapRadiusSelector from '@/features/map/ui/map-radius-selector/MapRadiusSelector';
import Icon from '@/shared/ui/icon/Icon';
import PageAction from '@/shared/ui/page-action/PageAction';

import { type MapRadius, RADIUS_OPTIONS, radiusLabel } from '../../hooks/useMapNearby';
import type { MapPropertySheetStage } from '../map-property-sheet/MapPropertySheet';

import styles from './MapControls.module.css';

type MapControlsProps = {
  isAddMode: boolean;
  selectedRadius: MapRadius | null;
  selectedCategories: MapCategory[];
  categoryCounts: Partial<Record<MapCategory, number>>;
  sheetStage: MapPropertySheetStage;
  dragHeight: number | null;
  isLocating: boolean;
  onSelectRadius: (radius: MapRadius) => void;
  onToggleCategory: (category: MapCategory) => void;
  onMoveToCurrentLocation: () => void;
  onEnterAddMode: () => void;
};

const MapControls = ({
  isAddMode,
  selectedRadius,
  selectedCategories,
  categoryCounts,
  sheetStage,
  dragHeight,
  isLocating,
  onSelectRadius,
  onToggleCategory,
  onMoveToCurrentLocation,
  onEnterAddMode,
}: MapControlsProps) => (
  <>
    {!isAddMode && (
      <>
        <MapRadiusSelector
          label="시설 확인 반경"
          options={RADIUS_OPTIONS.map((value) => ({
            value,
            label: radiusLabel(value),
            isSelected: selectedRadius === value,
          }))}
          onSelect={onSelectRadius}
        />
        <MapCategoryRail
          className={styles.categoryRail}
          selectedCategories={selectedCategories}
          counts={categoryCounts}
          onToggle={onToggleCategory}
        />
      </>
    )}
    <div className={styles.locationControls}>
      <button
        type="button"
        className={styles.currentLocationButton}
        aria-label="내 현재 위치로 이동"
        disabled={isLocating}
        onClick={onMoveToCurrentLocation}
      >
        <Icon name="target" size={22} />
      </button>
    </div>
    {!isAddMode && (
      <div
        className={styles.addPropertyAction}
        data-sheet={sheetStage}
        data-dragging={dragHeight === null ? undefined : 'true'}
        style={dragHeight === null ? undefined : ({ '--sheet-height': `${dragHeight}px` } as CSSProperties)}
      >
        <PageAction placement="inline" onClick={onEnterAddMode} aria-label="지도에서 매물 추가">
          매물 추가
        </PageAction>
      </div>
    )}
  </>
);

export default MapControls;
