import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getPropertyErrorMessage } from '@/features/property/api/propertyErrorMessages';
import { usePropertyDetail } from '@/features/property/api/useProperties';
import { useUpdateProperty } from '@/features/property/api/usePropertyMutations';
import {
  formatAmountForInput,
  formatMoneyInput,
  parseMoneyInput,
  WON_PER_MANWON,
} from '@/features/property/lib/propertyForm';
import { parsePositiveId } from '@/features/property/lib/propertyFormat';
import type { RoomOption, UtilityOption } from '@/features/property/model/Property';
import { MAINTENANCE_OPTIONS, PROPERTY_OPTIONS } from '@/features/property/model/propertyOptions';
import BottomActionArea from '@/shared/ui/bottom-action-area/BottomActionArea';
import { Button } from '@/shared/ui/button/Button';
import ContentState from '@/shared/ui/content-state/ContentState';
import InlineNotice from '@/shared/ui/inline-notice/InlineNotice';
import TextField from '@/shared/ui/text-field/TextField';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

import PropertyOptionPicker from './ui/property-option-picker/PropertyOptionPicker';

import styles from './PropertyMemoPage.module.css';

type AdditionalInfoValues = {
  availableMoveInDate: string;
  maintenanceFeeAmount: string;
  visitScheduledAt: string;
  discoverySource: string;
  roomOptions: RoomOption[];
  utilityOptions: UtilityOption[];
};

const PropertyMemoPage = () => {
  const propertyId = parsePositiveId(useParams().propertyId);
  if (propertyId === null) {
    return (
      <ContentState title="올바른 매물 주소가 아니에요.">
        <Link to="/properties">매물 목록으로 돌아가기</Link>
      </ContentState>
    );
  }
  return <ResolvedPropertyMemoPage propertyId={propertyId} />;
};

const ResolvedPropertyMemoPage = ({ propertyId }: { propertyId: number }) => {
  const navigate = useNavigate();
  const property = usePropertyDetail(propertyId);
  const updateProperty = useUpdateProperty(propertyId);
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
      <ContentState
        tone="error"
        title="부가 정보를 불러오지 못했어요."
        description={getPropertyErrorMessage(property.error)}
        onRetry={() => void property.refetch()}
      />
    );
  }
  if (property.isPending || values === null) {
    return <ContentState loading title="부가 정보를 불러오는 중이에요." />;
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

          void updateProperty
            .mutateAsync({
              current: property.data,
              changes: {
                availableMoveInDate: values.availableMoveInDate || null,
                maintenanceFeeAmount: maintenanceFeeInput === null ? null : maintenanceFeeInput * WON_PER_MANWON,
                visitScheduledAt: values.visitScheduledAt || null,
                discoverySource: values.discoverySource.trim() || null,
                roomOptions: values.roomOptions,
                utilityOptions: values.utilityOptions,
              },
            })
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
