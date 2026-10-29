import { formatRentSummary } from '@/features/property/lib/propertyFormat';
import type { PropertyCommuteTime, PropertySummary } from '@/features/property/model/Property';

export const propertyArea = (address: string | null) => {
  const parts = address?.split(/\s+/) ?? [];
  return (
    parts.find((part) => /(?:동|읍|면)$/.test(part)) ??
    parts.find((part) => /(?:구|군)$/.test(part)) ??
    parts.find((part) => /시$/.test(part)) ??
    '주소 미등록'
  );
};

export const recordPresentation = (property: PropertySummary) => ({
  /** 공용 매물 카드(PropertyCard)에 그대로 넘기는 원본 요약. */
  summary: property,
  id: String(property.propertyId),
  district: propertyArea(property.location.address),
  name: property.name,
  note: property.location.address ?? '주소 미등록',
  price:
    property.monthlyRentAmount > 0
      ? `월세 ${formatRentSummary(property.depositAmount, property.monthlyRentAmount)}`
      : formatRentSummary(property.depositAmount, property.monthlyRentAmount),
  latitude: property.location.latitude,
  longitude: property.location.longitude,
  checklist: property.stages.find((stage) => stage.stage === 'ON_SITE') ?? null,
  representativePhoto: property.representativePhoto,
});

type RecordPoint = { latitude: number | null; longitude: number | null };

/** 본 방 기록 지도 아래쪽 안내. 메모·매물을 남기는 방법과 위치 없는 기록·조회 실패를 알린다. */
export const recordsMapHint = (
  records: RecordPoint[],
  { facilitiesFailed, memo }: { facilitiesFailed: boolean; memo: { isFailed: boolean } },
) => {
  if (facilitiesFailed || memo.isFailed) return '지도 정보를 일부 불러오지 못했어요';
  const action = '빈 곳을 눌러 메모를 남기거나 매물을 기록해요';
  const base = records.length ? action : `아직 기록한 방이 없어요 · ${action}`;
  return records.some((record) => record.latitude === null || record.longitude === null)
    ? `${base} · 위치 없는 기록은 리스트에서 확인해요`
    : base;
};

/** 카드 맨 위에 붙이는 목적지까지 직선거리 한 줄. 1km 아래는 10m 단위, 그 위는 소수 한 자리 km로 적는다. */
export const destinationDistanceLabel = (destinationName: string, meters: number) => {
  const rounded = Math.round(meters / 10) * 10;
  return rounded < 1000
    ? `${destinationName}까지 ${rounded}m`
    : `${destinationName}까지 ${(meters / 1000).toFixed(1)}km`;
};

/** 카드에 붙이는 출퇴근 장소까지 통근 시간 한 줄. 서버는 60분·환승 2회 안에서만 시간을 구한다. */
export const commuteLabel = (commute: PropertyCommuteTime, destinationName: string, maxMinutes: number) => {
  if (commute.status === 'NO_LOCATION') return '위치가 없어 통근 시간을 몰라요';
  if (commute.status === 'UNREACHABLE') return `${destinationName}까지 ${maxMinutes}분 넘게 걸려요`;
  return `${destinationName}까지 대중교통 ${commute.commuteMinutes}분`;
};
