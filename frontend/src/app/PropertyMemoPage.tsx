import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPropertyErrorMessage } from '../apis/propertyErrorMessages';
import BottomActionArea from '../components/ui/BottomActionArea';
import { Button } from '../components/ui/Button';
import InlineNotice from '../components/ui/InlineNotice';
import TextField from '../components/ui/TextField';
import TopNavigation from '../components/ui/TopNavigation';
import { usePropertyDetail, usePropertyMemo } from '../hooks/query/useProperties';
import { useSavePropertyMemoDocument, useUpdateProperty } from '../hooks/query/usePropertyMutations';
import type { PublicConfig } from '../types/PublicConfig';
import { parsePositiveId } from '../utils/propertyFormat';
import styles from './PropertyMemoPage.module.css';
import ContentState from '../components/ui/ContentState';
import PropertyOptionPicker from '../components/PropertyOptionPicker';
import {
  MAINTENANCE_MEMO_LABEL,
  MAINTENANCE_OPTIONS,
  PROPERTY_OPTIONS,
  parseMaintenanceContent,
  parseSelectedLabels,
  propertyMemoDisplayLabel,
  serializeMaintenanceContent,
  serializeSelectedLabels,
} from '../constants/propertyOptions';

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
  const memo = usePropertyMemo(config, propertyId);
  const saveMemo = useSavePropertyMemoDocument(config, propertyId);
  const updateProperty = useUpdateProperty(config, propertyId);
  const [itemValues, setItemValues] = useState<Record<number, string>>({});
  const [discoverySource, setDiscoverySource] = useState('');

  useEffect(() => {
    if (memo.data === undefined) return;
    setItemValues(Object.fromEntries(memo.data.items.map((item) => [item.systemMemoItemId, item.content])));
  }, [memo.data]);

  useEffect(() => {
    if (property.data === undefined) return;
    setDiscoverySource(property.data.discoverySource.value);
  }, [property.data]);

  if (property.isPending || memo.isPending) {
    return <ContentState page={false} loading title="부가 정보를 불러오는 중이에요." />;
  }
  if (property.isError || memo.isError) {
    const error = property.error ?? memo.error;
    return (
      <main className="property-page">
        <ContentState
          page={false}
          tone="error"
          title="부가 정보를 불러오지 못했어요."
          description={getPropertyErrorMessage(error)}
          onRetry={() => {
            void property.refetch();
            void memo.refetch();
          }}
        />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <TopNavigation
        title={`${property.data.name} 부가 정보`}
        backTo={`/properties/${propertyId}`}
        backLabel="매물 상세로 돌아가기"
      />
      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await Promise.all([
              saveMemo.mutateAsync({
                items: memo.data.items.map((item) => ({
                  systemMemoItemId: item.systemMemoItemId,
                  content: itemValues[item.systemMemoItemId]?.trim() ?? '',
                })),
                freeMemo: memo.data.freeMemo,
              }),
              updateProperty.mutateAsync({
                name: property.data.name,
                depositAmount: property.data.depositAmount,
                monthlyRentAmount: property.data.monthlyRentAmount,
                discoverySource: discoverySource.trim() || null,
                roadAddress: property.data.location.roadAddress,
                jibunAddress: property.data.location.jibunAddress,
                latitude: property.data.location.latitude,
                longitude: property.data.location.longitude,
              }),
            ]);
            navigate(`/properties/${propertyId}`, { replace: true });
          } catch {
            // 각 mutation의 오류 상태를 폼 아래에서 보여 준다.
          }
        }}
      >
        <section className={styles.memoFields} aria-labelledby="structured-memo-heading">
          <h1 id="structured-memo-heading">부가 정보</h1>
          {memo.data.items.map((item) => {
            // 옵션과 관리비 포함 항목은 글로 적는 대신 골라서 넣는다.
            const picker = item.label.includes('옵션') ? { options: PROPERTY_OPTIONS, variant: 'icon' as const } : null;

            // 브라우저 기본 날짜 입력은 빈 상태에서도 연·월·일 형식을 강제하므로 자유롭게 적게 한다.
            if (item.label.includes('방문')) {
              return (
                <TextField
                  key={item.systemMemoItemId}
                  label={item.label}
                  value={itemValues[item.systemMemoItemId] ?? ''}
                  maxLength={100}
                  placeholder="예: 9월 5일 오후 2시"
                  onChange={(event) =>
                    setItemValues((current) => ({
                      ...current,
                      [item.systemMemoItemId]: event.target.value,
                    }))
                  }
                />
              );
            }

            if (item.label.includes('관리비')) {
              const value = itemValues[item.systemMemoItemId] ?? '';
              const { total, selected } = parseMaintenanceContent(value);
              return (
                <PropertyOptionPicker
                  key={item.systemMemoItemId}
                  label={MAINTENANCE_MEMO_LABEL}
                  options={MAINTENANCE_OPTIONS}
                  variant="badge"
                  selected={selected}
                  onChange={(next) =>
                    setItemValues((current) => ({
                      ...current,
                      [item.systemMemoItemId]: serializeMaintenanceContent(total, next),
                    }))
                  }
                >
                  <TextField
                    label="총 관리비"
                    value={total}
                    maxLength={50}
                    placeholder="예: 10만원"
                    onChange={(event) =>
                      setItemValues((current) => ({
                        ...current,
                        [item.systemMemoItemId]: serializeMaintenanceContent(event.target.value, selected),
                      }))
                    }
                  />
                </PropertyOptionPicker>
              );
            }

            if (picker !== null) {
              const value = itemValues[item.systemMemoItemId] ?? '';
              const labels = picker.options.map((option) => option.label);
              const { selected, extra } = parseSelectedLabels(value, labels);
              return (
                <PropertyOptionPicker
                  key={item.systemMemoItemId}
                  label={item.label}
                  options={picker.options}
                  variant={picker.variant}
                  selected={selected}
                  onChange={(next) =>
                    setItemValues((current) => ({
                      ...current,
                      [item.systemMemoItemId]: serializeSelectedLabels(next, extra, labels),
                    }))
                  }
                />
              );
            }

            return (
              <TextField
                key={item.systemMemoItemId}
                label={propertyMemoDisplayLabel(item.label)}
                value={itemValues[item.systemMemoItemId] ?? ''}
                maxLength={100}
                placeholder="필요한 내용을 입력해 주세요."
                onChange={(event) =>
                  setItemValues((current) => ({ ...current, [item.systemMemoItemId]: event.target.value }))
                }
              />
            );
          })}
          <TextField
            label="링크"
            value={discoverySource}
            maxLength={500}
            inputMode="url"
            autoComplete="url"
            placeholder="매물 링크를 입력해 주세요."
            onChange={(event) => setDiscoverySource(event.target.value)}
          />
        </section>
        {(saveMemo.isError || updateProperty.isError) && (
          <InlineNotice tone="error">부가 정보를 저장하지 못했어요. 다시 시도해 주세요.</InlineNotice>
        )}
        <BottomActionArea>
          <Button
            type="submit"
            variant="soft"
            fullWidth
            isLoading={saveMemo.isPending || updateProperty.isPending}
            loadingLabel="저장 중…"
          >
            부가 정보 저장
          </Button>
        </BottomActionArea>
      </form>
    </main>
  );
};

export default PropertyMemoPage;
