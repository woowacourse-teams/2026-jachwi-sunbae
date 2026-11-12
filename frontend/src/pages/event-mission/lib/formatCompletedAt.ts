const pad = (value: number) => String(value).padStart(2, '0');

/** 미션을 마친 시각을 기기 시간대로 `11월 12일 14:03`처럼 보여 준다. */
export const formatCompletedAt = (completedAt: number) => {
  const date = new Date(completedAt);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
