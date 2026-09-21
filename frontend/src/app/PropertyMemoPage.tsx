import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { UpdatePropertyRequestDto } from '../apis/dtos/PropertyDto';
import { getPropertyErrorMessage } from '../apis/propertyErrorMessages';
import { MAINTENANCE_OPTIONS, PROPERTY_OPTIONS } from '../constants/propertyOptions';
import PropertyOptionPicker from '../components/PropertyOptionPicker';
import BottomActionArea from '../components/ui/BottomActionArea';
import { Button } from '../components/ui/Button';
import ContentState from '../components/ui/ContentState';
import InlineNotice from '../components/ui/InlineNotice';
import TextField from '../components/ui/TextField';
import TopNavigation from '../components/ui/TopNavigation';
import { usePropertyDetail } from '../hooks/query/useProperties';
import { useUpdateProperty } from '../hooks/query/usePropertyMutations';
import type { RoomOption, UtilityOption } from '../types/Property';
import type { PublicConfig } from '../types/PublicConfig';
import { formatAmountForInput, formatMoneyInput, parseMoneyInput, WON_PER_MANWON } from '../utils/propertyForm';
import { parsePositiveId } from '../utils/propertyFormat';
import styles from './PropertyMemoPage.module.css';

type AdditionalInfoValues = {
  availableMoveInDate: string;
  maintenanceFeeAmount: string;
  visitScheduledAt: string;
  discoverySource: string;
  roomOptions: RoomOption[];
  utilityOptions: UtilityOption[];
};

const PropertyMemoPage = ({ config }: { config: PublicConfig }) => {
  const propertyId = parsePositiveId(useParams().propertyId);
  if (propertyId === null) {
    return (
      <main className="property-page">
        <ContentState page={false} title="올바른 매물 주소가 아니에요.">
          <Link to="/properties">매물 목록으로 돌아가기</Link>
        </ContentState>
      </main>
    );
  }
  return <ResolvedPropertyMemoPage config={config} propertyId={propertyId} />;
};

const ResolvedPropertyMemoPage = ({ config, propertyId }: { config: PublicConfig; propertyId: number }) => {
  const navigate = useNavigate();
  const property = usePropertyDetail(config, propertyId);
  const updateProperty = useUpdateProperty(config, propertyId);
  const [values, setValues] = useState<AdditionalInfoValues | null>(null);

  useEffect(() => {
    if (property.data === undefined || values !== null) return;
    setValues({
      availableMoveInDate: property.data.availableMoveInDate ?? '',
      maintenanceFeeAmount:
        property.data.maintenanceFeeAmount === null ? '' : formatAmountForInput(property.data.maintenanceFeeAmount),
      visitScheduledAt: property.data.visitScheduledAt?.slice(0, 16) ?? '',
      discoverySource: property.data.discoverySource.value,
      roomOptions: property.data.roomOptions,
      utilityOptions: property.data.utilityOptions,
    });
  }, [property.data, values]);

  if (property.isError) {
    return (
      <main className="property-page">
        <ContentState
          page={false}
          tone="error"
          title="부가 정보를 불러오지 못했어요."
          description={getPropertyErrorMessage(property.error)}
          onRetry={() => void property.refetch()}
        />
      </main>
    );
  }
  if (property.isPending || values === null) {
    return <ContentState page={false} loading title="부가 정보를 불러오는 중이에요." />;
  }

  const setValue = <K extends keyof AdditionalInfoValues>(key: K, value: AdditionalInfoValues[K]) =>
    setValues((current) => (current === null ? current : { ...current, [key]: value }));

  return (
    <main className={styles.page}>
      <TopNavigation
        title={`${property.data.name} 부가 정보`}
        backTo={`/properties/${propertyId}`}
        backLabel="매물 상세로 돌아가기"
      />
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          const maintenanceFeeInput =
            values.maintenanceFeeAmount === '' ? null : parseMoneyInput(values.maintenanceFeeAmount);
          if (values.maintenanceFeeAmount !== '' && maintenanceFeeInput === null) return;

          const request: UpdatePropertyRequestDto = {
            name: property.data.name,
            depositAmount: property.data.depositAmount,
            monthlyRentAmount: property.data.monthlyRentAmount,
            address: property.data.location.address,
            latitude: property.data.location.latitude,
            longitude: property.data.location.longitude,
            availableMoveInDate: values.availableMoveInDate || null,
            maintenanceFeeAmount: maintenanceFeeInput === null ? null : maintenanceFeeInput * WON_PER_MANWON,
            visitScheduledAt: values.visitScheduledAt || null,
            discoverySource: values.discoverySource.trim() || null,
            roomOptions: values.roomOptions,
            utilityOptions: values.utilityOptions,
          };

          void updateProperty
            .mutateAsync(request)
            .then(() => navigate(`/properties/${propertyId}`, { replace: true }))
            .catch(() => undefined);
        }}
      >
        <section className={styles.memoFields} aria-labelledby="additional-info-heading">
          <h1 id="additional-info-heading">부가 정보</h1>
          <TextField
            label="입주 가능일"
            type="date"
            value={values.availableMoveInDate}
            onChange={(event) => setValue('availableMoveInDate', event.target.value)}
          />
          <PropertyOptionPicker
            label="관리비 포함 공과금"
            options={MAINTENANCE_OPTIONS}
            variant="badge"
            selected={values.utilityOptions}
            onChange={(next) => setValue('utilityOptions', next as UtilityOption[])}
          >
            <TextField
              label="총 관리비"
              suffix="만원"
              inputMode="numeric"
              value={values.maintenanceFeeAmount}
              placeholder="예: 10"
              onChange={(event) => {
                const formatted = formatMoneyInput(event.target.value);
                if (formatted !== null) setValue('maintenanceFeeAmount', formatted);
              }}
            />
          </PropertyOptionPicker>
          <PropertyOptionPicker
            label="방 옵션"
            options={PROPERTY_OPTIONS}
            selected={values.roomOptions}
            onChange={(next) => setValue('roomOptions', next as RoomOption[])}
          />
          <TextField
            label="방문 일정"
            type="datetime-local"
            value={values.visitScheduledAt}
            onChange={(event) => setValue('visitScheduledAt', event.target.value)}
          />
          <TextField
            label="확인한 곳"
            value={values.discoverySource}
            maxLength={500}
            placeholder="URL, 앱 이름 또는 중개사 정보"
            onChange={(event) => setValue('discoverySource', event.target.value)}
          />
        </section>
        {updateProperty.isError && (
          <InlineNotice tone="error">부가 정보를 저장하지 못했어요. 다시 시도해 주세요.</InlineNotice>
        )}
        <BottomActionArea>
          <Button type="submit" variant="soft" fullWidth isLoading={updateProperty.isPending} loadingLabel="저장 중…">
            부가 정보 저장
          </Button>
        </BottomActionArea>
      </form>
    </main>
  );
};

export default PropertyMemoPage;
