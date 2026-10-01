import type { PointerEvent, RefObject } from 'react';

import type { PropertySummary } from '@/features/property/model/Property';
import PropertyCard from '@/features/property/ui/property-card/PropertyCard';

import styles from './MapPropertySheet.module.css';

export type MapPropertySheetStage = 'closed' | 'mid' | 'full';

type MapPropertySheetProps = {
  sheetRef: RefObject<HTMLElement | null>;
  stage: MapPropertySheetStage;
  isDragging: boolean;
  properties: PropertySummary[];
  selectedPropertyId: number | null;
  onDragStart: (event: PointerEvent<HTMLButtonElement>) => void;
  onDragMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onDragEnd: (event: PointerEvent<HTMLButtonElement>) => void;
  onDragCancel: (event: PointerEvent<HTMLButtonElement>) => void;
  onCycleStage: () => void;
};

const MapPropertySheet = ({
  sheetRef,
  stage,
  isDragging,
  properties,
  selectedPropertyId,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  onCycleStage,
}: MapPropertySheetProps) => (
  <section
    ref={sheetRef}
    className={`${styles.sheet} ${stage === 'closed' ? styles.collapsed : stage === 'mid' ? styles.mid : styles.full}`}
    data-dragging={isDragging || undefined}
    aria-label="지도 주변 매물 목록"
  >
    <button
      type="button"
      className={styles.header}
      aria-expanded={stage !== 'closed'}
      aria-label={stage === 'closed' ? '지도 위 매물 목록 열기' : '지도 위 매물 목록 높이 변경'}
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragCancel}
      onClick={onCycleStage}
    >
      <div className={styles.grabber}>
        <span className={styles.handle} />
      </div>
      <div className={styles.heading}>
        <span>지도 위 매물</span>
        <strong>{properties.length}개</strong>
      </div>
    </button>

    <div className={styles.body}>
      {properties.length === 0 ? (
        <div className={styles.empty}>현재 지도 화면에 등록된 매물이 없어요.</div>
      ) : (
        <ul className={styles.list}>
          {properties.map((property) => (
            <li key={property.propertyId} data-selected={property.propertyId === selectedPropertyId || undefined}>
              <PropertyCard property={property} />
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
);

export default MapPropertySheet;
