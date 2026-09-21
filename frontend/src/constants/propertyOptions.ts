import type { RoomOption, UtilityOption } from '../types/Property';

/** Swagger의 RoomOption 값과 화면 표시 이름을 한곳에서 관리한다. */
export const PROPERTY_OPTIONS = [
  { key: 'AIR_CONDITIONER', label: '에어컨' },
  { key: 'REFRIGERATOR', label: '냉장고' },
  { key: 'WASHING_MACHINE', label: '세탁기' },
  { key: 'SINK', label: '싱크대' },
  { key: 'GAS_STOVE', label: '가스레인지' },
  { key: 'MICROWAVE', label: '전자레인지' },
  { key: 'SHOE_CABINET', label: '신발장' },
  { key: 'WARDROBE', label: '옷장' },
  { key: 'BED', label: '침대' },
  { key: 'DESK', label: '책상' },
  { key: 'TV', label: 'TV' },
  { key: 'INDUCTION', label: '인덕션' },
] as const;

export type PropertyOptionKey = RoomOption;

/** 관리비에 포함되는 항목. 아이콘 없이 글자 뱃지로 고른다. */
export const MAINTENANCE_OPTIONS = [
  { key: 'WATER', label: '수도세' },
  { key: 'ELECTRICITY', label: '전기세' },
  { key: 'GAS', label: '가스비' },
  { key: 'INTERNET', label: '인터넷' },
] as const;

export const MAINTENANCE_MEMO_LABEL = '관리비 포함 공과금';

export const roomOptionLabels = (options: RoomOption[]): string =>
  PROPERTY_OPTIONS.filter((option) => options.includes(option.key))
    .map((option) => option.label)
    .join(', ');

export const utilityOptionLabels = (options: UtilityOption[]): string =>
  MAINTENANCE_OPTIONS.filter((option) => options.includes(option.key))
    .map((option) => option.label)
    .join(', ');
