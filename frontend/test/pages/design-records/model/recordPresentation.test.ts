// @vitest-environment node
import { expect, it } from 'vitest';

import { destinationDistanceLabel } from '@/pages/design-records/model/recordPresentation';

it('목적지까지 거리는 1km 아래는 10m 단위로, 그 위는 소수 한 자리 km로 적는다', () => {
  expect(destinationDistanceLabel('신림역', 347)).toBe('신림역까지 350m');
  expect(destinationDistanceLabel('신림역', 996)).toBe('신림역까지 1.0km');
  expect(destinationDistanceLabel('신림역', 1000)).toBe('신림역까지 1.0km');
  expect(destinationDistanceLabel('신림역', 12_345)).toBe('신림역까지 12.3km');
});
