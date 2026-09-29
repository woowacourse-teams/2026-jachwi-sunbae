import type { CSSProperties, PointerEvent, RefObject } from 'react';
import type { PropertySummary } from '../../../../features/property/model/Property';
import type { PublicConfig } from '../../../../shared/config/publicConfigTypes';
import PropertyCard from '../../../../features/property/ui/property-card/PropertyCard';
import styles from './MapPropertySheet.module.css';

export type MapPropertySheetStage = 'closed' | 'mid' | 'full';

type MapPropertySheetProps = {
  sheetRef: RefObject<HTMLElement | null>;
  stage: MapPropertySheetStage;
  dragHeight: number | null;
  properties: PropertySummary[];
  selectedPropertyId: number | null;
  config: PublicConfig;
  onDragStart: (event: PointerEvent<HTMLDivElement>) => void;
  onDragMove: (event: PointerEvent<HTMLDivElement>) => void;
  onDragEnd: (event: PointerEvent<HTMLDivElement>) => void;
  onDragCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onCycleStage: () => void;
};

const MapPropertySheet = ({
  sheetRef,
  stage,
  dragHeight,
  properties,
  selectedPropertyId,
  config,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  onCycleStage,
}: MapPropertySheetProps) => (
  <section
    ref={sheetRef}
    className={`${styles.sheet} ${stage === 'closed' ? styles.collapsed : stage === 'mid' ? styles.mid : styles.full}`}
    style={dragHeight === null ? undefined : ({ height: `${dragHeight}px` } as CSSProperties)}
    data-dragging={dragHeight === null ? undefined : 'true'}
    aria-label="지도 주변 매물 목록"
  >
    <div
      className={styles.header}
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
    </div>

    <div className={styles.body}>
      {properties.length === 0 ? (
        <div className={styles.empty}>현재 지도 화면에 등록된 매물이 없어요.</div>
      ) : (
        <ul className={styles.list}>
          {properties.map((property) => (
            <li key={property.propertyId} data-selected={property.propertyId === selectedPropertyId || undefined}>
              <PropertyCard property={property} config={config} />
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
);

export default MapPropertySheet;
