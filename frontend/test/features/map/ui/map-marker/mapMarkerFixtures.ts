import type { MapMarker } from '@/features/map/model/Map';

const at = { latitude: 37.48, longitude: 126.93 };

/** 마커 모양 갈래를 한 번씩 지나는 예시. 지도 SDK용 DOM과 데모 지도용 React가 같은 마크업을 내는지 견줄 때 쓴다. */
export const markerFixtures: Array<{ name: string; marker: MapMarker; selectedMarkerId?: string }> = [
  { name: '기본 tone', marker: { id: 'plain', ...at, label: '이름만' } },
  { name: '매물', marker: { id: 'property', ...at, label: '신림역 원룸', tone: 'property', actionable: true } },
  {
    name: '고른 매물',
    marker: { id: 'property', ...at, label: '신림역 원룸', tone: 'property', actionable: true },
    selectedMarkerId: 'property',
  },
  {
    name: '매물 요약 카드',
    marker: { id: 'summary', ...at, label: '신림역 원룸', tone: 'property', summary: { amount: '500/45' } },
  },
  {
    name: '사진 매물',
    marker: {
      id: 'photo',
      ...at,
      label: '사진 원룸',
      tone: 'property',
      photo: 'https://example.com/a.jpg',
      summary: { amount: '1000/60' },
      actionable: true,
    },
  },
  {
    name: '사진 매물 군집',
    marker: { id: 'photo-cluster', ...at, label: '매물 3개', tone: 'propertyCluster', photo: '/p.jpg', count: 3 },
  },
  { name: '매물 군집', marker: { id: 'pc', ...at, label: '매물 8개', tone: 'propertyCluster', count: 8 } },
  { name: '현재 위치', marker: { id: 'current', ...at, label: '현재 위치', tone: 'current' } },
  { name: '시설', marker: { id: 'place', ...at, label: '병원', tone: 'place', category: 'HOSPITAL' } },
  { name: '카테고리 없는 시설', marker: { id: 'place-x', ...at, label: '어딘가', tone: 'place' } },
  {
    name: '메모 싫어요',
    marker: { id: 'memo', ...at, label: '어두운 골목', tone: 'place', category: 'MEMO', variant: 'negative' },
  },
  {
    name: '시설 군집',
    marker: { id: 'cluster', ...at, label: '주변 시설 12개', tone: 'cluster', category: 'CONVENIENCE', count: 12 },
  },
  { name: '카테고리 없는 군집', marker: { id: 'cluster-x', ...at, label: '12개', tone: 'cluster', count: 12 } },
  { name: '선택됨', marker: { id: 'selected', ...at, label: '선택한 매물', tone: 'selected' } },
  { name: '고른 장소', marker: { id: 'destination', ...at, label: '판교역로 166', tone: 'destination' } },
  {
    name: '흰 말풍선 튀어나옴',
    marker: {
      id: 'shop',
      ...at,
      label: '착한 가게 <b>',
      tone: 'destination',
      variant: 'light',
      pop: { delayMs: 120 },
      actionable: true,
    },
  },
  { name: '방금 남긴 메모', marker: { id: 'flash', ...at, label: '방금 메모', tone: 'flash', appear: true } },
  {
    name: '메모 묶음',
    marker: {
      id: 'street-memo:1,2',
      ...at,
      label: '거리 메모 3개',
      tone: 'destination',
      category: 'MEMO',
      tally: { positive: 2, negative: 1 },
      actionable: true,
    },
  },
  {
    name: '좋아요만 메모 묶음',
    marker: {
      id: 'street-memo:3',
      ...at,
      label: '거리 메모 3개',
      tone: 'destination',
      tally: { positive: 3, negative: 0 },
    },
  },
  {
    name: '검색 핀',
    marker: {
      id: 'search',
      ...at,
      label: '강남역',
      caption: '검색한 곳',
      tone: 'pinLabel',
      pinKind: 'search',
      removable: true,
      setsCommute: true,
      actionable: true,
    },
  },
  {
    name: '지우기만 있는 검색 핀',
    marker: {
      id: 'search-2',
      ...at,
      label: '역삼역',
      tone: 'pinLabel',
      pinKind: 'search',
      removable: true,
      actionable: true,
    },
  },
  { name: '출퇴근 장소', marker: { id: 'commute', ...at, label: '회사', tone: 'pinLabel', pinKind: 'commute' } },
  { name: '종류 없는 라벨 핀', marker: { id: 'pin', ...at, label: '여기', tone: 'pinLabel' } },
  {
    name: '순위',
    marker: { id: 'rank', ...at, label: '신림동', caption: '신림', tone: 'rank', rank: 1, actionable: true },
  },
  { name: '캡션 없는 순위', marker: { id: 'rank-2', ...at, label: '봉천동', tone: 'rank', rank: 2 } },
  { name: '색 점', marker: { id: 'dot', ...at, label: '편의점', tone: 'dot', color: '#ff8800' } },
  { name: '색 없는 점', marker: { id: 'dot-2', ...at, label: '편의점', tone: 'dot' } },
  {
    name: '골라 둔 시설',
    marker: {
      id: 'picked',
      ...at,
      label: '역',
      tone: 'place',
      category: 'TRANSPORT',
      variant: 'subway',
      selected: true,
    },
  },
];
