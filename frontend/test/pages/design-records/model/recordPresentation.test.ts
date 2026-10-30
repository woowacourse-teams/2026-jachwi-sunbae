// @vitest-environment node
import { expect, it } from 'vitest';

import { commuteDistanceLabel, shortDistanceLabel } from '@/pages/design-records/model/recordPresentation';

it('목적지까지 거리는 1km 아래는 10m 단위로, 그 위는 소수 한 자리 km로 적는다', () => {
  expect(shortDistanceLabel(347)).toBe('350m');
  expect(shortDistanceLabel(996)).toBe('1.0km');
  expect(shortDistanceLabel(1000)).toBe('1.0km');
  expect(commuteDistanceLabel(12_345)).toBe('통근거리 12.3km');
});
