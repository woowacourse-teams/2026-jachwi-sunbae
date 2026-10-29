/** 상세 화면에서 줄을 눌러 하나씩 고치는 항목. */
/** 매물 이름은 시트 없이 상세의 그 줄에서 바로 고친다. */
export type BasicEditField = 'price' | 'location';
export type AdditionalEditField =
  'availableMoveInDate' | 'maintenance' | 'roomOptions' | 'visitScheduledAt' | 'discoverySource';
export type PropertyEditField = BasicEditField | AdditionalEditField;

const basicFields: readonly PropertyEditField[] = ['price', 'location'];

export const isBasicEditField = (field: PropertyEditField): field is BasicEditField => basicFields.includes(field);

export const editFieldTitles: Record<PropertyEditField, string> = {
  price: '보증금 / 월세 수정',
  location: '주소 수정',
  availableMoveInDate: '입주 가능일 수정',
  maintenance: '관리비 수정',
  roomOptions: '방 옵션 수정',
  visitScheduledAt: '방문 일정 수정',
  discoverySource: '확인한 곳 수정',
};

/** 지도나 선택지가 있는 항목은 시트를 높게 연다. */
export const editFieldSheetHeight = (field: PropertyEditField): number => {
  if (field === 'location' || field === 'roomOptions') return 88;
  if (field === 'maintenance') return 70;
  return 45;
};
