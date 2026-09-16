import type { RoomOption, UtilityOption } from '../../types/Property';

export type PropertyInputDto = {
  name: string;
  depositAmount: number;
  monthlyRentAmount: number;
  discoverySource: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  availableMoveInDate: string | null;
  maintenanceFeeAmount: number | null;
  visitScheduledAt: string | null;
  roomOptions: RoomOption[];
  utilityOptions: UtilityOption[];
};

export type UpdatePropertyRequestDto = PropertyInputDto;

export type SavePropertyMemoDocumentRequestDto = {
  freeMemo: string;
};
