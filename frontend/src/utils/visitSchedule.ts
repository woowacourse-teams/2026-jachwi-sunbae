const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (value: number) => String(value).padStart(2, '0');

/** 저장한 문구를 `datetime-local` 인풋이 읽는 형식으로 바꾼다. 형식이 다르면 비워 둔다. */
export const toDateTimeLocal = (text: string): string => {
  const matched = /(\d{1,2})월\s*(\d{1,2})일[^\d]*(\d{1,2}):(\d{2})/.exec(text);
  if (matched === null) return '';
  const [, month, day, hour, minute] = matched;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(today.getFullYear(), Number(month) - 1, Number(day));
  // 해가 바뀐 뒤의 일정은 다음 해로 읽는다.
  if (target.getTime() < today.getTime()) target.setFullYear(today.getFullYear() + 1);
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(Number(hour))}:${minute}`;
};

/** 인풋 값을 읽기 좋은 우리말 문구로 바꿔 저장한다. */
export const fromDateTimeLocal = (value: string): string => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (matched === null) return '';
  const [, year, month, day, hour, minute] = matched;
  const weekday = WEEKDAYS[new Date(Number(year), Number(month) - 1, Number(day)).getDay()];
  return `${Number(month)}월 ${Number(day)}일 (${weekday}) ${hour}:${minute}`;
};
