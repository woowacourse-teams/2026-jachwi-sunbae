import type { PropertyInputDto } from '../apis/dtos/PropertyDto';

export const MAX_PROPERTY_AMOUNT = Number.MAX_SAFE_INTEGER;
export const WON_PER_MANWON = 10_000;

export type PropertyFormValues = {
  name: string;
  depositAmount: string;
  monthlyRentAmount: string;
  discoverySource: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type PropertyFormField = keyof PropertyFormValues;
export type PropertyFormErrors = Partial<Record<PropertyFormField, string>>;
export type PropertyFormMode = 'default' | 'registration';

const countCodePoints = (value: string) => Array.from(value).length;

export const formatMoneyInput = (value: string): string | null => {
  if (value === '') {
    return '';
  }

  if (!/^[0-9,]+$/.test(value)) {
    return null;
  }

  const digits = value.replace(/,/g, '');

  if (digits.length === 0) {
    return null;
  }

  const normalizedDigits = digits.replace(/^0+(?=\d)/, '');
  return normalizedDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatAmountForInput = (amount: number): string =>
  new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(amount / WON_PER_MANWON);

export const parseMoneyInput = (value: string): number | null => {
  const digits = value.replace(/,/g, '');

  if (!/^\d+$/.test(digits)) {
    return null;
  }

  const amount = Number(digits);
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= MAX_PROPERTY_AMOUNT ? amount : null;
};

const toWon = (manwon: number): number | null => {
  const amount = manwon * WON_PER_MANWON;
  return Number.isSafeInteger(amount) && amount <= MAX_PROPERTY_AMOUNT ? amount : null;
};

/** 주소·좌표는 지도에서 고르므로 여기서는 검증하지 않는다. 등록·수정 모드 차이도 없다. */
export const validatePropertyForm = (values: PropertyFormValues): PropertyFormErrors => {
  const errors: PropertyFormErrors = {};
  const name = values.name.trim();
  const discoverySource = values.discoverySource.trim();

  if (name.length === 0) {
    errors.name = '매물을 구분할 이름을 입력해 주세요.';
  } else if (countCodePoints(name) > 30) {
    errors.name = '이름은 30자 이하로 입력해 주세요.';
  }

  if (values.depositAmount === '') {
    errors.depositAmount = '보증금을 입력해 주세요.';
  } else if (values.depositAmount !== '' && parseMoneyInput(values.depositAmount) === null) {
    errors.depositAmount = '보증금은 0 이상 최대 안전 정수 이하의 정수로 입력해 주세요.';
  }

  if (values.monthlyRentAmount === '') {
    errors.monthlyRentAmount = '월세를 입력해 주세요.';
  } else if (values.monthlyRentAmount !== '' && parseMoneyInput(values.monthlyRentAmount) === null) {
    errors.monthlyRentAmount = '월세는 0 이상 최대 안전 정수 이하의 정수로 입력해 주세요.';
  }

  if (countCodePoints(discoverySource) > 500) {
    errors.discoverySource = '확인한 곳은 500자 이하로 입력해 주세요.';
  }

  return errors;
};

export const toPropertyInputDto = (values: PropertyFormValues): PropertyInputDto | null => {
  const depositInput = parseMoneyInput(values.depositAmount);
  const monthlyRentInput = parseMoneyInput(values.monthlyRentAmount);
  const depositAmount = depositInput === null ? undefined : toWon(depositInput);
  const monthlyRentAmount = monthlyRentInput === null ? undefined : toWon(monthlyRentInput);
  const address = values.address?.trim() ?? '';

  if (depositAmount === null || monthlyRentAmount === null) {
    return null;
  }

  return {
    name: values.name.trim(),
    depositAmount: depositAmount ?? 0,
    monthlyRentAmount: monthlyRentAmount ?? 0,
    discoverySource: values.discoverySource.trim() || null,
    address: address || null,
    latitude: values.latitude ?? null,
    longitude: values.longitude ?? null,
    availableMoveInDate: null,
    maintenanceFeeAmount: null,
    visitScheduledAt: null,
    roomOptions: [],
    utilityOptions: [],
  };
};

export const propertyFieldErrorMessage = (field: PropertyFormField): string => {
  const messages: Record<PropertyFormField, string> = {
    name: '서버에서 매물 이름을 확인하지 못했습니다.',
    depositAmount: '서버에서 보증금 값을 확인하지 못했습니다.',
    monthlyRentAmount: '서버에서 월세 값을 확인하지 못했습니다.',
    discoverySource: '서버에서 확인한 곳을 확인하지 못했습니다.',
    address: '주소를 확인해 주세요.',
    latitude: '선택한 위치의 위도를 확인해 주세요.',
    longitude: '선택한 위치의 경도를 확인해 주세요.',
  };

  return messages[field];
};
