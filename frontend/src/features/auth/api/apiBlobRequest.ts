import type { PublicConfig } from '@/shared/config/publicConfigTypes';

import { ApiError, captureUnexpectedApiError, executeRequest, isAbortError, throwResponseError } from './apiClient';

const apiBlobRequestInternal = async ({
  config,
  path,
  method = 'GET',
  body,
  acceptedContentTypes = ['image/jpeg', 'image/png', 'image/webp'],
  signal,
}: {
  config: PublicConfig;
  path: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  acceptedContentTypes?: string[];
  signal?: AbortSignal;
}): Promise<Blob> => {
  const headers = new Headers({ Accept: acceptedContentTypes.join(', ') });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await executeRequest({
    config,
    path,
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    requiresAuthentication: true,
  });

  if (!response.ok) {
    return throwResponseError(response);
  }

  const contentType = response.headers.get('Content-Type')?.split(';')[0]?.trim();

  if (contentType === undefined || !acceptedContentTypes.includes(contentType)) {
    throw new ApiError({ kind: 'invalid-response', status: response.status });
  }

  let blob: Blob;
  try {
    blob = await response.blob();
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError({ kind: 'invalid-response', status: response.status });
  }
  return blob.type === contentType ? blob : blob.slice(0, blob.size, contentType);
};

export const apiBlobRequest = async (options: Parameters<typeof apiBlobRequestInternal>[0]): Promise<Blob> => {
  try {
    return await apiBlobRequestInternal(options);
  } catch (error) {
    captureUnexpectedApiError({ error, path: options.path, method: options.method ?? 'GET' });
    throw error;
  }
};
