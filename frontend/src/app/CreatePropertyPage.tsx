import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNavigation from '../components/ui/TopNavigation';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { Button } from '../components/ui/Button';
import MapCanvas from '../components/MapCanvas';
import Icon from '../components/ui/Icon';
import SearchField from '../components/ui/SearchField';
import BottomActionArea from '../components/ui/BottomActionArea';
import TextField from '../components/ui/TextField';
import { useCreateProperty } from '../hooks/query/usePropertyMutations';
import type { PropertyInputDto } from '../apis/dtos/PropertyDto';
import type { MapAddress } from '../types/Map';
import type { PublicConfig } from '../types/PublicConfig';
import { reverseGeocode, searchAddress } from '../apis/mapApi';
import { DEFAULT_MAP_CENTER, requestCurrentMapLocation } from '../utils/mapLocation';
import {
  formatAmountForInput,
  formatMoneyInput,
  toPropertyInputDto,
  validatePropertyForm,
} from '../utils/propertyForm';
import type { PropertyFormErrors, PropertyFormValues } from '../utils/propertyForm';
import styles from './CreatePropertyPage.module.css';

type CreatePropertyRouteState = {
  registrationDraft?: PropertyInputDto;
  selectedLocation?: MapAddress;
};

const DEFAULT_PROPERTY_NAME = '새 매물';

const emptyValues: PropertyFormValues = {
  name: DEFAULT_PROPERTY_NAME,
  depositAmount: '',
  monthlyRentAmount: '',
  discoverySource: '',
};

const draftToValues = (draft: PropertyInputDto | undefined): PropertyFormValues =>
  draft === undefined
    ? emptyValues
    : {
        name: draft.name,
        depositAmount: draft.depositAmount === undefined ? '' : formatAmountForInput(draft.depositAmount),
        monthlyRentAmount: draft.monthlyRentAmount === undefined ? '' : formatAmountForInput(draft.monthlyRentAmount),
        discoverySource: draft.discoverySource ?? '',
      };

/**
 * 매물 등록 1단계. 이름과 보증금·월세만 받고, 주소는 다음 단계인 지도 화면에서 찍는다.
 * 실제 생성 요청은 위치를 확정하는 MapLocationSelectPage에서 보낸다.
 */
const CreatePropertyPage = ({ config }: { config: PublicConfig }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const keyboardInset = useKeyboardInset();
  const routeState = (location.state as CreatePropertyRouteState | null) ?? {};

  const [values, setValues] = useState<PropertyFormValues>(() => {
    const draft = draftToValues(routeState.registrationDraft);
    const selectedLocation = routeState.selectedLocation;
    return selectedLocation === undefined
      ? draft
      : {
          ...draft,
          roadAddress: selectedLocation.roadAddress ?? undefined,
          jibunAddress: selectedLocation.jibunAddress ?? undefined,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        };
  });
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  // 입력값이 바뀌는 즉시 다음 필드를 노출하지 않고, 사용자가 다음을 눌렀을 때만 한 단계씩 연다.
  const [revealedStep, setRevealedStep] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<MapAddress>(() =>
    routeState.selectedLocation ?? {
      address: null,
      roadAddress: null,
      jibunAddress: null,
      ...DEFAULT_MAP_CENTER,
    },
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapAddress[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [createError, setCreateError] = useState<string | null>(null);
  const createProperty = useCreateProperty(config);
  const geocodeSequence = useRef(0);
  const geocodeTimer = useRef<number | null>(null);

  const hasName = values.name.trim().length > 0;
  const hasDeposit = values.depositAmount.length > 0;
  const hasMonthlyRent = values.monthlyRentAmount.length > 0;

  const updateMoney = (field: 'depositAmount' | 'monthlyRentAmount', input: string) => {
    const formatted = formatMoneyInput(input);
    if (formatted === null) return;
    setValues((current) => ({ ...current, [field]: formatted }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateRevealedRequiredFields = () => {
    const nextErrors: PropertyFormErrors = {};
    if (!hasDeposit) nextErrors.depositAmount = '보증금을 입력해 주세요.';
    if (revealedStep >= 1 && !hasMonthlyRent) nextErrors.monthlyRentAmount = '월세를 입력해 주세요.';
    if (revealedStep >= 3 && !hasName) nextErrors.name = '매물 이름을 입력해 주세요.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length > 0;
  };

  const resolveLocation = useCallback(
    async (latitude: number, longitude: number) => {
      const sequence = geocodeSequence.current + 1;
      geocodeSequence.current = sequence;
      setLocationStatus('loading');
      try {
        const address = await reverseGeocode(config, latitude, longitude);
        if (geocodeSequence.current !== sequence) return;
        setSelectedLocation(address);
        setLocationStatus('ready');
      } catch {
        if (geocodeSequence.current !== sequence) return;
        setSelectedLocation((current) => ({ ...current, address: null, roadAddress: null, jibunAddress: null }));
        setLocationStatus('error');
      }
    },
    [config],
  );

  useEffect(() => {
    if (routeState.selectedLocation !== undefined) {
      setLocationStatus('ready');
      return;
    }
    void requestCurrentMapLocation()
      .then((coordinate) => resolveLocation(coordinate.latitude, coordinate.longitude))
      .catch(() => resolveLocation(DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude));
  }, [resolveLocation, routeState.selectedLocation]);

  useEffect(
    () => () => {
      if (geocodeTimer.current !== null) window.clearTimeout(geocodeTimer.current);
    },
    [],
  );

  const submitProperty = async () => {
    const validationErrors = validatePropertyForm(values, 'registration');
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0 || locationStatus !== 'ready') return;
    const input = toPropertyInputDto(values);
    if (input === null) return;
    setCreateError(null);
    try {
      const created = await createProperty.mutateAsync({
        ...input,
        roadAddress: selectedLocation.roadAddress,
        jibunAddress: selectedLocation.jibunAddress,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      navigate(`/properties/${created.propertyId}`, { replace: true });
    } catch {
      setCreateError('매물을 등록하지 못했어요. 입력한 정보는 유지되니 다시 시도해 주세요.');
    }
  };

  const submitAddressSearch = async () => {
    if (searchQuery.trim() === '') return;
    setSearchStatus('loading');
    try {
      setSearchResults(await searchAddress(config, searchQuery.trim()));
      setSearchStatus('idle');
    } catch {
      setSearchResults([]);
      setSearchStatus('error');
    }
  };

  const moveToCurrentLocation = async () => {
    setSearchStatus('loading');
    try {
      const coordinate = await requestCurrentMapLocation();
      await resolveLocation(coordinate.latitude, coordinate.longitude);
      setSearchStatus('idle');
    } catch {
      setSearchStatus('error');
    }
  };

  const handleNext = (event: React.FormEvent) => {
    event.preventDefault();

    if (validateRevealedRequiredFields()) return;

    if (revealedStep === 0) {
      setRevealedStep(1);
      return;
    }

    if (revealedStep === 1) {
      setRevealedStep(2);
      return;
    }

    if (revealedStep === 2) {
      setRevealedStep(3);
      return;
    }
    void submitProperty();
  };

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <TopNavigation
          className={styles.createNavigation}
          title="새 매물 등록"
          backTo="/properties"
          backLabel="매물 등록 닫기"
          navigationIcon="close"
        />

        <form
          className={styles.formContainer}
          style={{ '--keyboard-inset': `${keyboardInset}px` } as CSSProperties}
          onSubmit={handleNext}
        >
          <TextField
            label="보증금"
            suffix="만원"
            fieldClassName={`${styles.fieldGroup} ${styles.depositField}`}
            className={styles.input}
            aria-label="보증금 (만원)"
            inputMode="numeric"
            placeholder="예: 1,000"
            value={values.depositAmount}
            onChange={(event) => updateMoney('depositAmount', event.target.value)}
            error={errors.depositAmount}
            autoFocus
          />

          {revealedStep >= 1 && (
            <TextField
              label="월세"
              suffix="만원"
              fieldClassName={`${styles.fieldGroup} ${styles.rentField}`}
              className={styles.input}
              aria-label="월세 (만원)"
              inputMode="numeric"
              placeholder="예: 55"
              value={values.monthlyRentAmount}
              onChange={(event) => updateMoney('monthlyRentAmount', event.target.value)}
              error={errors.monthlyRentAmount}
              autoFocus={revealedStep === 1}
            />
          )}

          {revealedStep >= 2 && (
            <section className={styles.locationSection} aria-label="매물 위치 선택">
              <div className={styles.locationHeader}>
                <strong>위치를 선택해 주세요</strong>
                <button
                  type="button"
                  className={styles.currentLocationButton}
                  aria-label="현재 위치로 이동"
                  onClick={() => void moveToCurrentLocation()}
                >
                  <Icon name="target" size={18} />
                </button>
              </div>
              <div className={styles.addressSearchArea}>
                <SearchField
                  label="주소 검색"
                  value={searchQuery}
                  placeholder="도로명 또는 지번 주소를 입력해 주세요"
                  onValueChange={(value) => {
                    setSearchQuery(value);
                    setSearchResults([]);
                    setSearchStatus('idle');
                  }}
                  onSubmit={() => void submitAddressSearch()}
                  onClear={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setSearchStatus('idle');
                  }}
                  renderAsForm={false}
                />
                {searchStatus === 'loading' && <p className={styles.searchStatus}>주소를 찾는 중이에요.</p>}
                {searchStatus === 'error' && (
                  <p className={styles.errorNotice} role="alert">
                    주소를 찾지 못했어요. 다시 시도해 주세요.
                  </p>
                )}
                {searchResults.length > 0 && (
                  <ul className={styles.searchResults} aria-label="주소 검색 결과">
                    {searchResults.map((result) => (
                      <li key={`${result.latitude}-${result.longitude}`}>
                        <button
                          type="button"
                          onClick={() => {
                            geocodeSequence.current += 1;
                            setSelectedLocation(result);
                            setLocationStatus('ready');
                            setSearchResults([]);
                            setSearchQuery(result.roadAddress ?? result.jibunAddress ?? result.address ?? '');
                          }}
                        >
                          {result.roadAddress ?? result.jibunAddress ?? result.address}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={styles.mapPreview}>
                <MapCanvas
                  config={config}
                  center={selectedLocation}
                  level={5}
                  interactive
                  showCenterPin
                  onCenterChange={(latitude, longitude) => {
                    if (geocodeTimer.current !== null) window.clearTimeout(geocodeTimer.current);
                    geocodeTimer.current = window.setTimeout(() => void resolveLocation(latitude, longitude), 450);
                  }}
                />
              </div>
              <p className={styles.selectedAddress} aria-live="polite">
                {locationStatus === 'loading'
                  ? '주소를 확인하는 중이에요.'
                  : (selectedLocation.roadAddress ?? selectedLocation.jibunAddress ?? '주소를 확인하지 못했어요.')}
              </p>
              {locationStatus === 'error' && <p className={styles.errorNotice}>지도를 움직여 위치를 다시 선택해 주세요.</p>}
            </section>
          )}

          {revealedStep >= 3 && (
            <TextField
              label="매물 이름"
              fieldClassName={`${styles.fieldGroup} ${styles.nameField}`}
              className={styles.input}
              placeholder="예: 신림역 3번출구 햇빛 잘 드는 원룸"
              maxLength={30}
              value={values.name}
              onFocus={() => {
                if (values.name === DEFAULT_PROPERTY_NAME) {
                  setValues((current) => ({ ...current, name: '' }));
                }
              }}
              onChange={(event) => {
                const name = event.target.value;
                setValues((current) => ({ ...current, name }));
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              error={errors.name}
            />
          )}

          {createError !== null && (
            <p className={styles.errorNotice} role="alert">
              {createError}
            </p>
          )}

          <p className={styles.stepNotice}>
            {revealedStep >= 3 && locationStatus === 'ready'
              ? '필수 정보를 모두 입력했다면 매물을 등록해 주세요.'
              : revealedStep === 0
                ? '보증금을 입력한 뒤 다음을 눌러 주세요.'
                : revealedStep === 1
                  ? '월세를 입력한 뒤 다음을 눌러 주세요.'
                  : revealedStep === 2
                    ? '위치를 선택한 뒤 다음을 눌러 주세요.'
                    : '매물 이름을 입력해 주세요.'}
          </p>

          <BottomActionArea>
            <Button variant="primary" type="submit" fullWidth isLoading={createProperty.isPending}>
              {revealedStep >= 3 ? '매물 등록' : '다음'}
            </Button>
          </BottomActionArea>
        </form>
      </div>
    </main>
  );
};

export default CreatePropertyPage;
