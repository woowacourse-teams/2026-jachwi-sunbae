import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPropertyErrorMessage } from '../apis/propertyErrorMessages';
import BottomActionArea from '../components/ui/BottomActionArea';
import { Button } from '../components/ui/Button';
import InlineNotice from '../components/ui/InlineNotice';
import TextField from '../components/ui/TextField';
import { fromDateTimeLocal, toDateTimeLocal } from '../utils/visitSchedule';
import TopNavigation from '../components/ui/TopNavigation';
import { usePropertyDetail, usePropertyMemo } from '../hooks/query/useProperties';
import { useSavePropertyMemoDocument } from '../hooks/query/usePropertyMutations';
import type { PublicConfig } from '../types/PublicConfig';
import { parsePositiveId } from '../utils/propertyFormat';
import styles from './PropertyMemoPage.module.css';
import ContentState from '../components/ui/ContentState';
import PropertyOptionPicker from '../components/PropertyOptionPicker';
import {
  MAINTENANCE_OPTIONS,
  PROPERTY_OPTIONS,
  parseSelectedLabels,
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
  const [itemValues, setItemValues] = useState<Record<number, string>>({});

  useEffect(() => {
    if (memo.data === undefined) return;
    setItemValues(Object.fromEntries(memo.data.items.map((item) => [item.systemMemoItemId, item.content])));
  }, [memo.data]);

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
        onSubmit={(event) => {
          event.preventDefault();
          void saveMemo
            .mutateAsync({
              items: memo.data.items.map((item) => ({
                systemMemoItemId: item.systemMemoItemId,
                content: itemValues[item.systemMemoItemId]?.trim() ?? '',
              })),
              freeMemo: memo.data.freeMemo,
            })
            .then(() => navigate(`/properties/${propertyId}`, { replace: true }))
            .catch(() => undefined);
        }}
      >
        <p className={styles.description}>필요한 항목만 적어도 됩니다.</p>
        <section className={styles.memoFields} aria-labelledby="structured-memo-heading">
          <h1 id="structured-memo-heading">부가 정보</h1>
          {memo.data.items.map((item) => {
            // 옵션과 관리비 포함 항목은 글로 적는 대신 골라서 넣는다.
            const picker = item.label.includes('옵션')
              ? { options: PROPERTY_OPTIONS, variant: 'icon' as const }
              : item.label.includes('관리비')
                ? { options: MAINTENANCE_OPTIONS, variant: 'badge' as const }
                : null;

            // 방문 일정은 날짜라서 글로 적기보다 달력에서 고르는 편이 빠르다.
            if (item.label.includes('방문')) {
              return (
                <TextField
                  key={item.systemMemoItemId}
                  label={item.label}
                  type="datetime-local"
                  value={toDateTimeLocal(itemValues[item.systemMemoItemId] ?? '')}
                  onChange={(event) =>
                    setItemValues((current) => ({
                      ...current,
                      [item.systemMemoItemId]: fromDateTimeLocal(event.target.value),
                    }))
                  }
                />
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
                label={item.label}
                value={itemValues[item.systemMemoItemId] ?? ''}
                maxLength={100}
                placeholder="필요한 내용을 입력해 주세요."
                onChange={(event) =>
                  setItemValues((current) => ({ ...current, [item.systemMemoItemId]: event.target.value }))
                }
              />
            );
          })}
        </section>
        {saveMemo.isError && (
          <InlineNotice tone="error">부가 정보를 저장하지 못했어요. 다시 시도해 주세요.</InlineNotice>
        )}
        <BottomActionArea>
          <Button type="submit" variant="soft" fullWidth isLoading={saveMemo.isPending} loadingLabel="저장 중…">
            부가 정보 저장
          </Button>
        </BottomActionArea>
      </form>
    </main>
  );
};

export default PropertyMemoPage;
