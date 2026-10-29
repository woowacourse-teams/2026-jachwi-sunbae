import { css } from '@emotion/css';

import type { GoodPriceResult } from '@/features/good-price/model/GoodPriceStore';
import useAddressSearch from '@/features/map/api/useAddressSearch';
import AddressSearchResults from '@/features/map/ui/address-search-results/AddressSearchResults';
import MapCanvas from '@/features/map/ui/map-canvas/MapCanvas';
import BottomSheet from '@/shared/ui/bottom-sheet/BottomSheet';
import { Button } from '@/shared/ui/button/Button';
import Icon from '@/shared/ui/icon/Icon';
import SearchField from '@/shared/ui/search-field/SearchField';

import useRestaurantMap from '../hooks/useRestaurantMap';
import MealSheet from './MealSheet';
import StoreCard from './store-card/StoreCard';
import StoreDetail from './store-detail/StoreDetail';

import * as shared from './MealContent.styles';

const RestaurantPanel = ({ active }: { active: boolean }) => {
  const map = useRestaurantMap(active);
  const search = useAddressSearch();
  const data = map.query.isError ? undefined : map.query.data;
  return (
    <section className={styles.panel} aria-label="주변 착한가격업소">
      <div className={styles.controls}>
        <button type="button" className={styles.search} onClick={map.openSearch}>
          <Icon name="search" size={18} />
          <span>{map.area.label}</span>
          <small>주소 검색</small>
        </button>
        <div className={styles.row}>
          <div className={styles.radii} role="group" aria-label="탐색 반경">
            {([500, 1000, 2000] as GoodPriceResult['radius'][]).map((radius) => (
              <button
                key={radius}
                type="button"
                aria-pressed={map.radius === radius}
                onClick={() => map.selectRadius(radius)}
              >
                {radius === 500 ? '500m' : `${radius / 1000}km`}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.locate}
            disabled={map.isLocating}
            onClick={() => void map.locate()}
            aria-label="현재 위치로 찾기"
          >
            <Icon name="locate" size={19} />
            {map.isLocating ? '확인 중' : '현재 위치'}
          </button>
        </div>
        <p className={styles.notice}>음식점 외 업종도 포함돼요. 가게별 원본 업종을 확인해 주세요.</p>
        {map.locationError && (
          <p className={styles.notice} role="alert">
            {map.locationError}
          </p>
        )}
      </div>
      <div className={styles.map}>
        {active && (
          <MapCanvas
            onRetry={() => window.location.reload()}
            center={map.viewport}
            markers={map.markers}
            circles={[{ radiusMeters: map.radius, label: `${map.radius}m` }]}
            radiusCenter={map.area}
            level={map.level}
            interactive
            selectedMarkerId={map.selectedStore ? String(map.selectedStore.id) : null}
            onSelectMarker={(marker) => map.openStore(Number(marker.id))}
            onCenterChange={map.moveMap}
            onLevelChange={map.changeLevel}
          />
        )}
        {map.isMapMoved && (
          <button type="button" className={styles.research} onClick={map.searchMap}>
            이 위치에서 찾기
          </button>
        )}
        {!map.listOpen ? (
          <button type="button" className={styles.showList} onClick={() => map.setListOpen(true)}>
            가게 목록 보기 {data ? `· ${data.count}곳` : ''}
          </button>
        ) : (
          <BottomSheet
            title={map.selectedStore?.name ?? `착한가격 가게 ${data?.count ?? 0}곳`}
            initialHeightPercent={40}
            onClose={() => {
              if (map.selectedStore) map.closeOverlay();
              else map.setListOpen(false);
            }}
            closeLabel={map.selectedStore ? '가게 상세 닫기' : '가게 목록 닫기'}
            onBack={map.selectedStore ? map.closeOverlay : undefined}
          >
            <div className={styles.sheetContent}>
              {map.query.isPending ? (
                <p role="status">주변 가게를 찾고 있어요…</p>
              ) : map.query.isError ? (
                <div role="alert">
                  <p>가게 정보를 불러오지 못했어요.</p>
                  <Button onClick={() => void map.query.refetch()}>다시 시도</Button>
                </div>
              ) : map.selectedStore ? (
                <StoreDetail store={map.selectedStore} dataAsOf={data?.dataAsOf ?? null} />
              ) : data?.count === 0 ? (
                <div className={shared.empty}>
                  <p>이 반경 안에 등록된 가게가 없어요.</p>
                  <Button variant="secondary" onClick={map.openSearch}>
                    다른 동네 찾기
                  </Button>
                </div>
              ) : (
                <>
                  <p className={styles.notice}>가까운 순 · 기준 위치에서 직선거리 · 등록 가격</p>
                  <ul className={styles.list} aria-label="가게 목록">
                    {data?.stores.map((store) => (
                      <li key={store.id}>
                        <StoreCard store={store} onSelect={map.openStore} />
                      </li>
                    ))}
                  </ul>
                  <p className={shared.note}>
                    행정안전부 착한가격업소 현황 · {data?.dataAsOf ?? '기준일 정보 없음'}
                    <br />
                    방문 전 가격과 영업 여부를 확인해 주세요.
                  </p>
                </>
              )}
            </div>
          </BottomSheet>
        )}
      </div>
      {map.isSearchOpen && active && (
        <MealSheet title="어느 동네를 둘러볼까요?" onClose={map.closeOverlay}>
          <Button fullWidth variant="secondary" isLoading={map.isLocating} onClick={() => void map.locate()}>
            현재 위치로 찾기
          </Button>
          {map.locationError && <p role="alert">{map.locationError}</p>}
          <div className={styles.addressSearch}>
            <SearchField
              label="동네 주소 검색"
              placeholder="도로명이나 지번 주소 검색"
              value={search.query}
              onValueChange={search.changeQuery}
              onSubmit={() => void search.submit()}
            />
          </div>
          <AddressSearchResults
            results={search.results}
            status={search.status}
            onSelect={(address) => {
              map.chooseArea({
                latitude: address.latitude,
                longitude: address.longitude,
                label: address.roadAddress ?? address.jibunAddress ?? '선택한 위치',
              });
              search.clear();
            }}
          />
        </MealSheet>
      )}
    </section>
  );
};
const styles = {
  panel: css`
    label: RestaurantPanel-panel;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  `,
  controls: css`
    label: RestaurantPanel-controls;
    padding: 0.8rem 1rem 0.5rem;
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-border);
  `,
  search: css`
    label: RestaurantPanel-search;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    min-height: 44px;
    padding: 0.6rem 0.8rem;
    border: 0;
    border-radius: var(--radius-md);
    background: var(--color-search-surface);
    color: var(--color-ink);
    font: inherit;
    cursor: pointer;
    & span {
      flex: 1;
      text-align: left;
      font-size: 0.83rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    & small {
      flex-shrink: 0;
      font-size: 0.7rem;
    }
  `,
  row: css`
    label: RestaurantPanel-row;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 0.5rem;
  `,
  radii: css`
    label: RestaurantPanel-radii;
    display: flex;
    gap: 0.3rem;
    & button {
      min-height: 44px;
      padding: 0.4rem 0.7rem;
      border: 1px solid var(--color-border);
      border-radius: 99px;
      background: var(--color-surface);
      color: var(--color-ink);
      font-size: 0.78rem;
      cursor: pointer;
    }
    & button[aria-pressed='true'] {
      background: var(--color-action);
      color: var(--color-on-action);
    }
  `,
  locate: css`
    label: RestaurantPanel-locate;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    min-height: 44px;
    padding: 0.4rem;
    background: none;
    border: 0;
    color: var(--color-ink);
    font-size: 0.75rem;
    cursor: pointer;
  `,
  notice: css`
    label: RestaurantPanel-notice;
    font-size: 0.7rem;
    color: var(--color-ink-soft);
    line-height: 1.5;
    margin: 0.5rem 0 0.2rem;
  `,
  map: css`
    label: RestaurantPanel-map;
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
    & .BottomSheet-sheet header h2 {
      white-space: normal;
      overflow-wrap: anywhere;
    }
  `,
  research: css`
    label: RestaurantPanel-research;
    position: absolute;
    z-index: 25;
    left: 50%;
    top: 0.75rem;
    transform: translateX(-50%);
    border: 0;
    border-radius: 99px;
    padding: 0.7rem 1rem;
    min-height: 44px;
    background: var(--color-action);
    color: var(--color-on-action);
    font-weight: 700;
    box-shadow: 0 2px 8px #0002;
    cursor: pointer;
    white-space: nowrap;
  `,
  showList: css`
    label: RestaurantPanel-showList;
    position: absolute;
    bottom: max(1rem, env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    z-index: 25;
    min-height: 44px;
    padding: 0.7rem 1.2rem;
    border: 0;
    border-radius: 99px;
    background: var(--color-action);
    color: var(--color-on-action);
    cursor: pointer;
    white-space: nowrap;
  `,
  list: css`
    label: RestaurantPanel-list;
    list-style: none;
    padding: 0;
    margin: 0;
  `,
  addressSearch: css`
    label: RestaurantPanel-addressSearch;
    margin-top: 1rem;
  `,
  sheetContent: css`
    label: RestaurantPanel-sheetContent;
    padding-bottom: env(safe-area-inset-bottom);
  `,
};
export default RestaurantPanel;
