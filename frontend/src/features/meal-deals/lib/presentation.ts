export const won = (value: number) => `${value.toLocaleString('ko-KR')}원`;
export const formatKst = (value: string | null) => {
  if (value === null) return '정보 없음';
  // 배달 lastVerifiedAt은 오프셋 없는 KST, 편의점 collectedAt은 +09:00을 포함한다.
  const date = new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}+09:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
export const httpsUrl = (value: string): string | undefined => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
};
