/** 상세 화면에서 줄을 눌러 그 줄 안에서 하나씩 고치는 항목. 매물 이름은 `PropertyNameInput`이 따로 맡는다. */
export type BasicEditField = 'price' | 'location';
export type AdditionalEditField =
  'availableMoveInDate' | 'maintenance' | 'roomOptions' | 'visitScheduledAt' | 'discoverySource';
export type PropertyEditField = BasicEditField | AdditionalEditField;
