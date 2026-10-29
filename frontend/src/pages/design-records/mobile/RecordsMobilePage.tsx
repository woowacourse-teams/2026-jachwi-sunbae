import { css } from '@emotion/css';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { HOME_PATH } from '@/shared/lib/navigation/appPaths';
import Icon from '@/shared/ui/icon/Icon';

import useQuickCreateProperty from '../hooks/useQuickCreateProperty';
import useRecords from '../hooks/useRecords';
import useRecordsAddMode from '../hooks/useRecordsAddMode';
import useRecordsMapLayers from '../hooks/useRecordsMapLayers';
import {
  parseRecordsView,
  readLastRecordsView,
  RECORDS_VIEW_PARAM,
  type RecordsView,
  writeLastRecordsView,
} from '../model/recordsView';
import RecordAddressSearch from '../ui/record-address-search/RecordAddressSearch';
import RecordDistricts from '../ui/record-districts/RecordDistricts';
import RecordList from '../ui/record-list/RecordList';
import RecordListSkeleton from '../ui/record-list/RecordListSkeleton';
import RecordLoadError from '../ui/record-load-error/RecordLoadError';
import RecordNotice from '../ui/record-notice/RecordNotice';
import RecordsMobileMap from './RecordsMobileMap';

/**
 * 휴대폰·태블릿 본 방 기록. 위에서 지도·리스트를 바꿔 보고, 지도 보기에서는 헤더와 동네 뱃지를 지도 위에 띄운다.
 * 지도에서 고른 방은 지도 아래 요약 카드로, 리스트에서 고른 방은 상세 화면으로 연다.
 * 지도는 예전 인프라 지도의 시설·거리 메모 카테고리와 찍은 위치의 메모·매물 등록을 함께 맡는다.
 */
const RecordsMobilePage = () => {
  const navigate = useNavigate();
  const records = useRecords();
  const { setNotice } = records;
  // 휴대폰은 지도를 찍어 추가하지 않고, 메모·매물 모두 아래쪽 추가 버튼의 추가 모드에서 위치를 고른다.
  const layers = useRecordsMapLayers(records, { initialCategory: 'MEMO' });
  const addMode = useRecordsAddMode();
  // 추가 모드에서 고른 위치로 등록 화면 없이 바로 매물을 만들고 그 상세로 간다.
  const quickCreate = useQuickCreateProperty({
    onCreated: (propertyId) => {
      addMode.cancel();
      navigate(`/properties/${propertyId}`);
    },
    onError: () => setNotice('매물을 만들지 못했어요. 다시 시도해 주세요.'),
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseRecordsView(searchParams.get(RECORDS_VIEW_PARAM)) ?? readLastRecordsView();
  // 보기 방식을 주소에 남겨, 상세·체크리스트에서 뒤로 돌아와도 보던 보기(리스트 등)로 열리게 한다.
  const setView = (next: RecordsView) => {
    writeLastRecordsView(next);
    setSearchParams(
      (current) => {
        current.set(RECORDS_VIEW_PARAM, next);
        return current;
      },
      { replace: true },
    );
  };
  const showsMap = view === 'map';
  // 오른쪽 위 검색 버튼을 누르면 헤더 자리를 주소 검색창으로 바꾼다.
  const [isSearching, setIsSearching] = useState(false);
  // 헤더·동네 뱃지는 지도가 실제로 보일 때만 지도 위에 띄운다. 불러오는 중·실패 안내를 가리지 않게 한다.
  const overMap = showsMap && records.properties.isSuccess;

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <div className={overMap ? styles.mapChrome : undefined}>
          <h1 ref={records.headingRef} className="sr-only" tabIndex={-1}>
            본 방 기록
          </h1>
          {/* 추가 모드에서는 위쪽 탭을 모두 거두고, 그 자리에 지도가 추가 모드 안내 토스트를 띄운다. */}
          {!addMode.isAddMode && (
            <>
              {isSearching ? (
                <div className={styles.searchHeader}>
                  {/* 주소를 고르면 지도 보기로 바꿔 그 자리로 옮긴다. */}
                  <RecordAddressSearch
                    autoFocus
                    onBack={() => setIsSearching(false)}
                    onSelect={(address) => {
                      records.moveTo(address);
                      setView('map');
                      setIsSearching(false);
                    }}
                  />
                </div>
              ) : (
                <header className={styles.header}>
                  <Link className={styles.back} to={HOME_PATH} aria-label="홈으로 돌아가기">
                    <Icon name="chevron-left" size={24} />
                  </Link>
                  <nav className={styles.viewSwitch} aria-label="기록 보기 방식">
                    <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>
                      <Icon name="map" size={17} /> 지도
                    </button>
                    <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
                      <Icon name="checklist" size={17} /> 리스트
                    </button>
                  </nav>
                  <button
                    className={styles.back}
                    type="button"
                    aria-label="주소 검색 열기"
                    onClick={() => setIsSearching(true)}
                  >
                    <Icon name="search" size={20} />
                  </button>
                </header>
              )}
              <RecordDistricts
                districts={records.districts}
                district={records.district}
                onSelect={records.selectDistrict}
                overMap={overMap}
              />
            </>
          )}
        </div>
        <div className={styles.body}>
          {records.properties.isPending ? (
            <RecordListSkeleton className={styles.list} />
          ) : records.properties.isError ? (
            <RecordLoadError
              className={styles.list}
              error={records.properties.error}
              onRetry={() => void records.properties.refetch()}
            />
          ) : showsMap ? (
            <RecordsMobileMap
              records={records}
              layers={layers}
              addMode={addMode}
              isAddingProperty={quickCreate.isCreating}
              onAddProperty={quickCreate.create}
            />
          ) : (
            <RecordList
              className={styles.list}
              records={records.records}
              district={records.district}
              commute={records.commute}
              onNotice={setNotice}
            />
          )}
        </div>
        {/* 지도 보기는 지도 안의 매물 추가 버튼을 쓰므로, 리스트 보기에만 기록하기 버튼을 둔다. */}
        {!showsMap && (
          <button type="button" className={styles.add} onClick={() => navigate('/properties/new')}>
            <Icon name="plus" size={20} /> 기록하기
          </button>
        )}
        <RecordNotice message={records.notice} onClose={() => setNotice('')} />
      </div>
    </main>
  );
};

const styles = {
  /* 휴대폰·태블릿 본 방 기록: 화면 틀, 리스트 칸, 기록하기 버튼, 헤더(뒤로가기·지도/리스트 전환), 지도 위에 뜬 헤더. */
  page: css`
    label: RecordsMobilePage-page;
    height: 100dvh;
    background: #f0f2f5;
    color: #25282d;
  `,

  frame: css`
    label: RecordsMobilePage-frame;
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(100%, 48rem);
    height: 100%;
    margin: 0 auto;
    background: white;
    overflow: hidden;

    & button:focus-visible {
      outline: 2px solid #25282d;
      outline-offset: 3px;
    }
  `,

  body: css`
    label: RecordsMobilePage-body;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  `,

  list: css`
    label: RecordsMobilePage-list;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.75rem 1rem 6rem;
    background: white;

    /* 태블릿 너비부터는 배치는 그대로 두고 글자와 여백만 키운다. */
    @media (min-width: 768px) {
      padding: 1rem 1.5rem 7rem;
    }
  `,

  add: css`
    label: RecordsMobilePage-add;
    position: absolute;
    right: 1rem;
    bottom: max(1.5rem, env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 1rem 1.2rem;
    border: 0;
    border-radius: 2rem;
    background: #648fff;
    color: white;
    box-shadow: 0 4px 16px #396ae837;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 650;
    cursor: pointer;

    @media (min-width: 768px) {
      right: 1.5rem;
      font-size: 0.95rem;
    }
  `,

  header: css`
    label: RecordsMobilePage-header;
    display: grid;
    grid-template-columns: 2.5rem 1fr 2.5rem;
    align-items: center;
    padding: max(0.85rem, env(safe-area-inset-top)) 1rem 0.7rem;

    @media (min-width: 768px) {
      padding: max(1.1rem, env(safe-area-inset-top)) 1.5rem 0.8rem;
    }
  `,

  /* 검색 중에는 헤더와 같은 자리에 검색창만 둔다. */
  searchHeader: css`
    label: RecordsMobilePage-searchHeader;
    display: flex;
    padding: max(0.85rem, env(safe-area-inset-top)) 1rem 0.7rem;

    @media (min-width: 768px) {
      padding: max(1.1rem, env(safe-area-inset-top)) 1.5rem 0.8rem;
    }
  `,

  /* 뒤로가기와 보기 전환은 지도·리스트 어느 쪽에서도 같은 모양이어서, 보기를 바꿔도 움직이거나 바뀌지 않는다. */
  back: css`
    label: RecordsMobilePage-back;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid #e3e5e9;
    border-radius: 50%;
    padding: 0;
    background: white;
    box-shadow: 0 2px 10px #00000018;
    color: #383c43;
    text-decoration: none;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid #25282d;
      outline-offset: 3px;
    }
  `,

  viewSwitch: css`
    label: RecordsMobilePage-viewSwitch;
    display: flex;
    padding: 0.3rem;
    width: max-content;
    justify-self: center;
    border: 1px solid #e3e5e9;
    background: white;
    border-radius: 2rem;
    box-shadow: 0 2px 10px #00000018;

    & button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      min-width: 5.1rem;
      padding: 0.6rem 0.7rem;
      border: 0;
      border-radius: 1.5rem;
      font: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      color: #a2a4a9;
      background: transparent;
      cursor: pointer;
    }

    & button[aria-pressed='true'] {
      color: white;
      background: #3e4048;
    }

    @media (min-width: 768px) {
      & button {
        min-width: 6rem;
        font-size: 0.95rem;
      }
    }
  `,

  /*
   * 지도 보기에서는 헤더와 동네 뱃지를 흰 배경 없이 지도 위에 띄운다.
   * 빈 자리는 지도 조작을 막지 않는다. 뒤로가기·보기 전환은 흰 바탕과 테두리·그림자로 지도 위에서도 잘 보인다.
   */
  mapChrome: css`
    label: RecordsMobilePage-mapChrome;
    position: absolute;
    z-index: 15;
    top: 0;
    right: 0;
    left: 0;
    pointer-events: none;

    & a,
    & button,
    & nav {
      pointer-events: auto;
    }
  `,
};

export default RecordsMobilePage;
