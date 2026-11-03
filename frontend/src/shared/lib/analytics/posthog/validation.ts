export const isValidPostHogConfiguration = (projectToken: string, host: string): boolean => {
  if (projectToken.trim().length === 0) return false;
  try {
    const url = new URL(host);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
