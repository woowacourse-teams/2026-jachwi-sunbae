/** 배열에서 항목 하나를 위아래로 한 칸 옮긴다. 범위를 벗어나면 원본을 그대로 돌려준다. */
export const moveItem = <T,>(items: T[], index: number, direction: -1 | 1): T[] => {
  const destination = index + direction;
  if (index < 0 || index >= items.length || destination < 0 || destination >= items.length) return items;
  const result = [...items];
  [result[index], result[destination]] = [result[destination], result[index]];
  return result;
};
