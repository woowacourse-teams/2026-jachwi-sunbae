import { useState } from 'react';

import PropertyCard from '@/features/property/ui/property-card/PropertyCard';
import { LogClick } from '@/shared/lib/analytics/logging';
import { RECORDS_PATH } from '@/shared/lib/navigation/appPaths';
import EmptyState from '@/shared/ui/empty-state/EmptyState';
import Icon from '@/shared/ui/icon/Icon';

import type { RecordsState } from '../../hooks/useRecords';
import RecordAddressSearch from '../record-address-search/RecordAddressSearch';
import RecordCardMenu from './RecordCardMenu';

import * as styles from './RecordList.styles';

type RecordListProps = {
  records: RecordsState['records'];
  district: string;
  /** 동네 찾기에서 고른 출퇴근 장소까지 통근 시간. `통근 시간` 버튼을 켜면 카드마다 가격 아래에 붙인다. 리스트에서 장소를 정하거나 바꾸지는 않는다. */
  commute?: RecordsState['commute'];
  /** 목적지까지 거리. 지도 레일의 `통근`으로 켜면 카드마다 이름 위에 붙이고, 리스트 위 줄의 `바꾸기`로 목적지를 바꾼다. */
  distance?: RecordsState['distance'];
  /** 주면 기록을 눌러도 상세로 넘어가지 않고 이 함수를 부른다(데스크탑은 리스트 자리에 상세를 연다). */
  onOpen?: (recordId: string) => void;
  onNotice: (message: string) => void;
  className?: string;
};

/** 기록 리스트. 인프라 지도 매물 목록과 같은 공용 PropertyCard에 더보기(삭제) 메뉴를 붙인다. */
const RecordList = ({ records, district, commute, distance, onOpen, onNotice, className }: RecordListProps) => {
  // 목적지를 바꾸는 검색창을 펼쳤는지. 거리를 보여 주는 동안 `바꾸기`를 누르면 펼친다.
  const [isPickingDestination, setIsPickingDestination] = useState(false);

  return (
    <section className={className} aria-labelledby="record-list-heading">
      <h2 id="record-list-heading" className="sr-only">
        {district === '전체' ? '모든 기록' : `${district} 기록`}
      </h2>
      {/* 리스트 필터는 아직 기능 구현 전이라 모양만 두고 누를 수 없게 막는다. */}
      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="기록 필터 (준비 중)">
          <button type="button" disabled>
            최근순 <Icon name="chevron-down" size={14} />
          </button>
          <button type="button" disabled>
            월세 <Icon name="chevron-down" size={14} />
          </button>
          <button type="button" disabled>
            체크 진행 <Icon name="chevron-down" size={14} />
          </button>
        </div>
        <div className={styles.toolbarActions}>
          {commute !== undefined && commute.destinationName !== null ? (
            <LogClick event="property_commute_times_toggled" params={{ shown: !commute.isShown }}>
              <button
                type="button"
                className={styles.commuteToggle}
                aria-pressed={commute.isShown}
                title={`${commute.destinationName}까지 대중교통 통근 시간`}
                onClick={commute.toggle}
              >
                {commute.isLoading ? '계산 중…' : '통근 시간'}
              </button>
            </LogClick>
          ) : (
            <span className={styles.comingSoon}>필터 준비 중</span>
          )}
        </div>
      </div>
      {distance !== undefined && distance.destination !== null && distance.isShown && !isPickingDestination && (
        <p className={styles.destinationRow}>
          <span>{distance.destination.name} 기준 통근거리</span>
          <button type="button" onClick={() => setIsPickingDestination(true)}>
            바꾸기
          </button>
        </p>
      )}
      {distance !== undefined && isPickingDestination && (
        <div className={styles.destinationSearch}>
          <RecordAddressSearch
            autoFocus
            label="통근 장소 검색"
            placeholder="학교나 회사 주소를 찾아요"
            onBack={() => setIsPickingDestination(false)}
            onSelect={(address) => {
              distance.setDestination({
                latitude: address.latitude,
                longitude: address.longitude,
                name: address.roadAddress ?? address.jibunAddress ?? address.address ?? '통근 장소',
              });
              setIsPickingDestination(false);
            }}
          />
        </div>
      )}
      {commute?.isShown && commute.isError && (
        <p className={styles.commuteError} role="alert">
          통근 시간을 불러오지 못했어요.
        </p>
      )}
      {records.length === 0 && (
        <EmptyState
          variant="plain"
          illustration="empty-properties"
          title={district === '전체' ? '아직 기록한 방이 없어요' : `${district}에 기록한 방이 없어요`}
          description="집을 보러 가면 사진과 체크한 내용을 남겨 두세요. 여기에 모여요."
        />
      )}
      <ul className={styles.items}>
        {records.map((record) => (
          <li key={record.id}>
            <PropertyCard
              property={record.summary}
              returnTo={RECORDS_PATH}
              onOpen={onOpen === undefined ? undefined : () => onOpen(record.id)}
              meta={commute?.labels.get(record.id)}
              eyebrow={distance?.labels.get(record.id)}
              actions={<RecordCardMenu propertyId={Number(record.id)} propertyName={record.name} onDone={onNotice} />}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RecordList;
