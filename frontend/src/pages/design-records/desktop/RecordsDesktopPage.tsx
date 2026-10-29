import { css } from '@emotion/css';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import CreatePropertyPage from '@/pages/create-property/CreatePropertyPage';
import PropertyDetailPage from '@/pages/property-detail/PropertyDetailPage';
import type { MapAddress } from '@/features/map/model/Map';
import { RECORDS_PATH } from '@/shared/lib/navigation/appPaths';
import DesktopHeader from '@/shared/ui/desktop-header/DesktopHeader';
import ListDetailLayout from '@/shared/ui/list-detail-layout/ListDetailLayout';

import useRecords from '../hooks/useRecords';
import useRecordsMapLayers from '../hooks/useRecordsMapLayers';
import RecordDistricts from '../ui/record-districts/RecordDistricts';
import RecordList from '../ui/record-list/RecordList';
import RecordListSkeleton from '../ui/record-list/RecordListSkeleton';
import RecordLoadError from '../ui/record-load-error/RecordLoadError';
import RecordNotice from '../ui/record-notice/RecordNotice';
import RecordsDesktopMap from './RecordsDesktopMap';

/**
 * 데스크탑 본 방 기록. 왼쪽 칸에 리스트, 오른쪽에 지도를 두고 보기 전환 없이 함께 본다.
 * 리스트나 지도에서 고른 방(`/properties/:propertyId`)과 새 매물 등록은 동네 찾기처럼 리스트 옆 칸에 연다.
 * 리스트를 덮지 않으므로 상세를 연 채로 다른 방을 바로 고를 수 있고, 지도 왼쪽 위 닫기 버튼으로 칸을 접는다.
 * 새 매물은 따로 둔 기록하기 버튼 없이 지도에서 위치를 찍어 등록하고, 찍은 주소·좌표를 등록 칸에 미리 채운다.
 * 지도는 예전 인프라 지도의 시설·거리 메모 카테고리와 찍은 위치의 메모·매물 등록을 함께 맡는다.
 */
const RecordsDesktopPage = () => {
  const navigate = useNavigate();
  const records = useRecords({
    selectedId: useParams().propertyId ?? null,
    setSelectedId: (id) => navigate(id === null ? RECORDS_PATH : `${RECORDS_PATH}/${id}`),
  });
  const { selected, setSelectedId, setNotice } = records;
  // 지도에서 찍어 연 새 매물 등록 칸의 위치. 없으면 등록 칸을 닫은 상태다.
  const [creatingAt, setCreatingAt] = useState<MapAddress | null>(null);
  // 휴대폰처럼 처음 들어오면 거리 메모를 켠 채로 연다.
  const layers = useRecordsMapLayers(records, {
    initialCategory: 'MEMO',
    registeringAt: creatingAt,
    onRegister: (location) => {
      setSelectedId(null);
      setCreatingAt(location);
    },
  });
  const showsSelectedPanel = creatingAt === null && selected !== undefined;
  const closeDetail = () => (creatingAt !== null ? setCreatingAt(null) : setSelectedId(null));

  const list = records.properties.isPending ? (
    <RecordListSkeleton className={styles.list} />
  ) : records.properties.isError ? (
    <RecordLoadError
      className={styles.list}
      error={records.properties.error}
      onRetry={() => void records.properties.refetch()}
    />
  ) : (
    <RecordList
      className={styles.list}
      records={records.records}
      district={records.district}
      commute={records.commute}
      onOpen={(id) => {
        setCreatingAt(null);
        setSelectedId(id);
      }}
      onNotice={setNotice}
    />
  );

  const detail =
    creatingAt !== null ? (
      <aside className={styles.detail} aria-label="새 매물 등록 패널">
        <CreatePropertyPage
          // 다른 위치를 찍어 다시 열면 입력을 처음부터 시작한다.
          key={`${creatingAt.latitude},${creatingAt.longitude}`}
          panel={{
            initialLocation: creatingAt,
            onClose: () => setCreatingAt(null),
            onCreated: (propertyId) => {
              setCreatingAt(null);
              records.setDistrict('전체');
              setSelectedId(String(propertyId));
              setNotice('매물을 기록했어요.');
            },
          }}
        />
      </aside>
    ) : showsSelectedPanel ? (
      <aside className={styles.detail} aria-label="선택한 매물 상세">
        <PropertyDetailPage
          key={selected.id}
          panel={{ propertyId: Number(selected.id), onClose: () => setSelectedId(null) }}
        />
      </aside>
    ) : undefined;

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <DesktopHeader />
        <h1 ref={records.headingRef} className="sr-only" tabIndex={-1}>
          본 방 기록
        </h1>
        <ListDetailLayout
          className={styles.body}
          list={list}
          detail={detail}
          onCloseDetail={closeDetail}
          closeLabel={creatingAt !== null ? '매물 등록 칸 닫기' : '매물 상세 칸 닫기'}
        >
          {!records.properties.isPending && !records.properties.isError && (
            <RecordsDesktopMap
              records={records}
              layers={layers}
              className={styles.map}
              districts={
                <RecordDistricts
                  districts={records.districts}
                  district={records.district}
                  onSelect={records.selectDistrict}
                  overMap
                />
              }
            />
          )}
        </ListDetailLayout>
        <RecordNotice message={records.notice} onClose={() => setNotice('')} className={styles.notice} />
      </div>
    </main>
  );
};

const styles = {
  /* 데스크탑 본 방 기록: 화면 전체를 쓰며 왼쪽에 리스트, 그 옆에 매물 등록·상세 칸, 오른쪽에 지도를 나란히 둔다. */
  page: css`
    label: RecordsDesktopPage-page;
    height: 100dvh;
    background: #f0f2f5;
    color: #25282d;
  `,

  frame: css`
    label: RecordsDesktopPage-frame;
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: white;
    overflow: hidden;

    & button:focus-visible {
      outline: 2px solid #25282d;
      outline-offset: 3px;
    }
  `,

  /* 지도 위쪽 동네 뱃지 줄 아래에 상세 닫기 버튼을 둔다. */
  body: css`
    label: RecordsDesktopPage-body;
    --list-detail-close-top: 4.5rem;
    flex: 1;
    height: auto;
  `,

  list: css`
    label: RecordsDesktopPage-list;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem 1.5rem 1.5rem;
    background: white;
  `,

  /* 매물 등록·상세는 자체 여백을 가지므로 칸에는 스크롤만 둔다. */
  detail: css`
    label: RecordsDesktopPage-detail;
    min-height: 0;
    overflow-y: auto;
    background: white;
  `,

  map: css`
    label: RecordsDesktopPage-map;
    height: 100%;
  `,

  notice: css`
    label: RecordsDesktopPage-notice;
    right: 1.5rem;
    bottom: 1.5rem;
    left: auto;
    width: 22rem;
  `,
};

export default RecordsDesktopPage;
