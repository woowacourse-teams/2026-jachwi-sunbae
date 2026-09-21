/**
 * 새 매물에 자동으로 적용할 체크리스트를 기억한다.
 * 처음에는 제공 템플릿을 쓰고, 사용자가 한 번 고르면 다음 매물부터 그 목록으로 시작한다.
 */
const STORAGE_KEY = 'jachwi-sunbae:last-checklist';

export type ChecklistSelection = number | 'SYSTEM_DEFAULT';

export const readLastSelectedChecklist = (): ChecklistSelection => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw === 'SYSTEM_DEFAULT') return 'SYSTEM_DEFAULT';
    const checklistId = Number(raw);
    return Number.isInteger(checklistId) && checklistId > 0 ? checklistId : 'SYSTEM_DEFAULT';
  } catch {
    // 저장소를 막아 둔 브라우저에서는 제공 템플릿으로 시작한다.
    return 'SYSTEM_DEFAULT';
  }
};

export const writeLastSelectedChecklist = (selection: ChecklistSelection): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(selection));
  } catch {
    /* 기억하지 못해도 흐름은 그대로 이어간다. */
  }
};

export const clearLastSelectedChecklist = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 위와 같다. */
  }
};
