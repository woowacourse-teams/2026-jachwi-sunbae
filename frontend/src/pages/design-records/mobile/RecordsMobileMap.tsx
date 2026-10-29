import { css } from '@emotion/css';

import type { MapAddress, MapMarker } from '@/features/map/model/Map';
import MapCanvas from '@/features/map/ui/map-canvas/MapCanvas';
import MapCategoryRail from '@/features/map/ui/map-category-rail/MapCategoryRail';
import MapZoomControl from '@/features/map/ui/map-zoom-control/MapZoomControl';
import StreetMemoSheet from '@/features/street-memo/ui/street-memo-sheet/StreetMemoSheet';
import Icon from '@/shared/ui/icon/Icon';

import type { RecordsState } from '../hooks/useRecords';
import type useRecordsAddMode from '../hooks/useRecordsAddMode';
import type { RecordsMapLayers } from '../hooks/useRecordsMapLayers';
import { recordsMapHint } from '../model/recordPresentation';
import RecordsAddBar from './RecordsAddBar';
import RecordsAddButton from './RecordsAddButton';
import RecordsSelectedCard from './RecordsSelectedCard';

const ADD_POINT_MARKER_ID = 'add-point';

type Props = {
  records: RecordsState;
  layers: RecordsMapLayers;
  addMode: ReturnType<typeof useRecordsAddMode>;
  onAddProperty: (address: MapAddress) => void;
  /** 고른 위치로 매물을 만드는 중이면 추가 버튼을 로딩으로 둔다. */
  isAddingProperty?: boolean;
};

/**
 * 휴대폰·태블릿 본 방 기록 지도. 위에 뜬 헤더 아래로 시설·거리 메모 카테고리 레일을 둔다.
 * 마커를 누르려다 잘못 찍기 쉬워 평소에 빈 곳을 찍으면 열린 매물·메모를 닫기만 한다.
 * 메모·매물은 가운데 아래 추가 버튼에서 고르면 추가 모드에 들어가, 마커를 모두 거둔 지도에서 위치를 찍어 고른다.
 */
const RecordsMobileMap = ({ records, layers, addMode, onAddProperty, isAddingProperty = false }: Props) => {
  const { selected } = records;
  const { isAddMode } = addMode;
  const addMarkers: MapMarker[] =
    addMode.coordinate === null
      ? []
      : [{ ...addMode.coordinate, id: ADD_POINT_MARKER_ID, label: '선택한 위치', tone: 'destination' }];
  const confirmAdd = () => {
    if (addMode.kind === 'property') {
      if (addMode.address !== null) onAddProperty(addMode.address);
      return;
    }
    const point = addMode.coordinate;
    addMode.cancel();
    if (point !== null) layers.memo.startDraft(point);
  };
  const hasBottomLayer = selected !== undefined || layers.memo.mode !== null;
  const { canvasProps } = layers;
  return (
    <section className={styles.map} aria-label="본 방 기록 지도">
      <MapCanvas
        {...canvasProps}
        // 추가 모드에서는 매물·시설·메모 마커를 모두 거두고, 찍은 자리를 추가할 위치로 고른다.
        markers={isAddMode ? addMarkers : canvasProps.markers}
        selectedMarkerId={isAddMode ? null : canvasProps.selectedMarkerId}
        onSelectMarker={isAddMode ? undefined : canvasProps.onSelectMarker}
        onSelectLocation={
          isAddMode ? (latitude, longitude) => addMode.select({ latitude, longitude }) : layers.closeAll
        }
      />
      {!isAddMode && (
        <MapCategoryRail
          showMemo
          showIcons={false}
          className={styles.rail}
          selectedCategories={layers.category === null ? [] : [layers.category]}
          counts={layers.counts}
          onToggle={layers.toggleCategory}
        />
      )}
      {/* 매물 추가 모드는 아래쪽 현재 위치에서 추가 버튼이 같은 일을 하므로 위쪽 버튼을 거둔다. */}
      {addMode.kind !== 'property' && (
        <button
          className={styles.recenter}
          type="button"
          aria-label="현재 위치로 이동"
          onClick={() => records.moveToCurrentLocation()}
        >
          <Icon name="target" size={22} />
        </button>
      )}
      <MapZoomControl className={styles.zoom} level={records.level} onChange={records.setLevel} />
      {addMode.kind === 'property' && (
        // 지금 있는 방을 기록할 때는 지도를 찍지 않고 현재 위치를 바로 매물 위치로 고른다.
        <button className={styles.addHere} type="button" onClick={() => records.moveToCurrentLocation(addMode.select)}>
          <Icon name="target" size={18} /> 현재 위치에서 추가
        </button>
      )}
      {addMode.kind !== null ? (
        <RecordsAddBar
          kind={addMode.kind}
          coordinate={addMode.coordinate}
          address={addMode.address}
          status={addMode.addressStatus}
          isConfirming={isAddingProperty}
          onCancel={addMode.cancel}
          onConfirm={confirmAdd}
        />
      ) : (
        <>
          {!hasBottomLayer && (
            <RecordsAddButton
              hint={recordsMapHint(records.records, layers, false)}
              onChoose={(kind) => {
                layers.closeAll();
                addMode.enter(kind);
              }}
            />
          )}
          {selected && <RecordsSelectedCard record={selected} onClose={() => records.setSelectedId(null)} />}
          <StreetMemoSheet layer={layers.memo} onCreated={layers.showMemos} />
        </>
      )}
    </section>
  );
};

const styles = {
  /* 휴대폰·태블릿 본 방 기록 지도. 위에 뜬 헤더·동네 뱃지 아래로 카테고리 레일·현재 위치 버튼을 두고, 아래쪽에 선택 매물 카드·찍은 위치 버튼을 띄운다. */
  map: css`
    label: RecordsMobileMap-map;
    position: relative;
    flex: 1;
    min-height: 0;
  `,

  rail: css`
    label: RecordsMobileMap-rail;
    top: calc(max(0.85rem, env(safe-area-inset-top)) + 11.4rem);
    right: 0.75rem;
    z-index: 12;
  `,

  /* 메모 탭까지 여섯 칸(한 칸 2.5rem)인 레일 아래에 둔다. */
  recenter: css`
    label: RecordsMobileMap-recenter;
    position: absolute;
    top: calc(max(0.85rem, env(safe-area-inset-top)) + 27rem);
    right: 0.95rem;
    z-index: 12;
    display: grid;
    place-items: center;
    width: 2.65rem;
    height: 2.65rem;
    border: 0;
    border-radius: 50%;
    color: #41444b;
    background: #fff;
    box-shadow: 0 2px 10px #00000016;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid #25282d;
      outline-offset: 3px;
    }
  `,

  /* 헤더·동네 뱃지 아래 오른쪽 위에 두고, 카테고리 레일은 그 아래로 내린다. */
  zoom: css`
    label: RecordsMobileMap-zoom;
    top: calc(max(0.85rem, env(safe-area-inset-top)) + 8.15rem);
    right: 0.75rem;
  `,

  /* 추가 모드 아래쪽 취소와 추가 버튼 줄 바로 위 오른쪽에 둔다. */
  addHere: css`
    label: RecordsMobileMap-addHere;
    position: absolute;
    right: 1rem;
    bottom: calc(max(1.5rem, env(safe-area-inset-bottom)) + 3.75rem);
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.7rem 1rem;
    border: 1px solid #e3e5e9;
    border-radius: 2rem;
    background: white;
    box-shadow: 0 4px 16px rgb(0 0 0 / 14%);
    color: #383c43;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 650;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid #25282d;
      outline-offset: 3px;
    }
  `,
};

export default RecordsMobileMap;
