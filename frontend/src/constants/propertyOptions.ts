/** 부가 정보의 옵션에서 고를 수 있는 항목. content에는 label을 쉼표로 이어 저장한다. */
export const PROPERTY_OPTIONS = [
  { key: 'airConditioner', label: '에어컨' },
  { key: 'refrigerator', label: '냉장고' },
  { key: 'washer', label: '세탁기' },
  { key: 'sink', label: '싱크대' },
  { key: 'stove', label: '가스레인지' },
  { key: 'microwave', label: '전자레인지' },
  { key: 'shoeRack', label: '신발장' },
  { key: 'closet', label: '옷장' },
  { key: 'bed', label: '침대' },
  { key: 'desk', label: '책상' },
  { key: 'tv', label: 'TV' },
  { key: 'induction', label: '인덕션' },
] as const;

export type PropertyOptionKey = (typeof PROPERTY_OPTIONS)[number]['key'];

/** 관리비에 포함되는 항목. 아이콘 없이 글자 뱃지로 고른다. */
export const MAINTENANCE_OPTIONS = [
  { key: 'water', label: '수도세' },
  { key: 'electricity', label: '전기세' },
  { key: 'gas', label: '가스비' },
  { key: 'internet', label: '인터넷' },
] as const;

export const MAINTENANCE_MEMO_LABEL = '관리비 포함 공과금';

const MAINTENANCE_ALIASES: Record<(typeof MAINTENANCE_OPTIONS)[number]['label'], readonly string[]> = {
  수도세: ['수도세', '수도'],
  전기세: ['전기세', '전기'],
  가스비: ['가스비', '가스'],
  인터넷: ['인터넷'],
};

export const propertyMemoDisplayLabel = (label: string): string =>
  label.includes('관리비') ? MAINTENANCE_MEMO_LABEL : label;

/** 관리비 메모의 `총액 (포함 공과금)` 표현을 편집 UI 상태로 나눈다. */
export const parseMaintenanceContent = (content: string): { total: string; selected: string[] } => {
  const parenthesized = /^(.*?)\s*\((.*?)\)\s*$/.exec(content.trim());
  const optionText = parenthesized?.[2] ?? content;
  const selected = MAINTENANCE_OPTIONS.filter((option) =>
    MAINTENANCE_ALIASES[option.label].some((alias) => optionText.split(',').some((token) => token.trim() === alias)),
  ).map((option) => option.label);

  return {
    total: parenthesized?.[1]?.trim() ?? (selected.length === 0 ? content.trim() : ''),
    selected,
  };
};

export const serializeMaintenanceContent = (total: string, selected: string[]): string => {
  const normalizedTotal = total.trim();
  const normalizedSelected = MAINTENANCE_OPTIONS.map((option) => option.label).filter((label) =>
    selected.includes(label),
  );
  if (normalizedTotal === '') return normalizedSelected.join(', ');
  if (normalizedSelected.length === 0) return normalizedTotal;
  return `${normalizedTotal} (${normalizedSelected.join(', ')})`;
};

/** 저장된 문자열을 고른 항목과 직접 적은 나머지로 나눈다. */
export const parseSelectedLabels = (
  content: string,
  labels: readonly string[],
): { selected: string[]; extra: string[] } => {
  const tokens = content
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  return {
    selected: tokens.filter((token) => labels.includes(token)),
    extra: tokens.filter((token) => !labels.includes(token)),
  };
};

/** 고른 항목은 목록 순서대로, 직접 적은 값은 뒤에 붙여 되돌린다. */
export const serializeSelectedLabels = (selected: string[], extra: string[], labels: readonly string[]): string =>
  [...labels.filter((label) => selected.includes(label)), ...extra].join(', ');
