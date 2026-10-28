import { css, cx } from '@emotion/css';
import type { FormEvent } from 'react';
import { useState } from 'react';

import type { ApiError } from '@/features/auth/api/apiClient';
import BottomActionArea from '@/shared/ui/bottom-action-area/BottomActionArea';
import { Button } from '@/shared/ui/button/Button';
import InlineNotice from '@/shared/ui/inline-notice/InlineNotice';
import TextAreaField from '@/shared/ui/text-field/TextAreaField';
import TextField from '@/shared/ui/text-field/TextField';

import type { PropertyInputDto } from '../../api/dtos/PropertyDto';
import { getPropertyErrorMessage } from '../../api/propertyErrorMessages';
import type {
  PropertyFormErrors,
  PropertyFormField,
  PropertyFormMode,
  PropertyFormValues,
} from '../../lib/propertyForm';
import { propertyFieldErrorMessage, toPropertyInputDto, validatePropertyForm } from '../../lib/propertyForm';
import MoneyField from '../money-field/MoneyField';

type PropertyFormProps = {
  initialValues: PropertyFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  mutationError: ApiError | null;
  formNotice?: string | null;
  variant?: 'default' | 'detail';
  mode?: PropertyFormMode;
  embedded?: boolean;
  onSubmit: (input: PropertyInputDto, values: PropertyFormValues) => void;
  onSelectLocation?: () => void;
};

const fields: PropertyFormField[] = ['name', 'depositAmount', 'monthlyRentAmount', 'discoverySource', 'address'];

const PropertyForm = ({
  initialValues,
  submitLabel,
  isSubmitting,
  mutationError,
  formNotice,
  variant = 'default',
  mode = 'default',
  embedded = false,
  onSubmit,
  onSelectLocation,
}: PropertyFormProps) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<PropertyFormErrors>({});

  const displayedErrors = { ...errors };
  mutationError?.invalidFields.forEach((field) => {
    const matchedField = fields.find((candidate) => candidate === field);
    if (matchedField !== undefined && displayedErrors[matchedField] === undefined)
      displayedErrors[matchedField] = propertyFieldErrorMessage(matchedField);
  });

  const setValue = (field: PropertyFormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validatePropertyForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const input = toPropertyInputDto(values);
    if (input !== null) onSubmit(input, values);
  };

  return (
    <form
      className={`${styles.form} ${variant === 'detail' ? styles.detailForm : ''}`}
      noValidate
      onSubmit={handleSubmit}
    >
      <TextField
        id="property-name"
        name="name"
        label="이름"
        requirement="필수"
        value={values.name}
        maxLength={30}
        autoComplete="off"
        placeholder="예: 신림역 근처 원룸"
        fieldClassName={variant === 'detail' ? styles.detailField : styles.defaultField}
        className={variant === 'detail' ? styles.detailInput : styles.defaultInput}
        error={displayedErrors.name}
        onChange={(event) => setValue('name', event.target.value)}
      />

      {mode !== 'registration' && (
        <div className={styles.locationFields}>
          <TextField
            id="property-address"
            name="address"
            label="주소"
            requirement="선택"
            value={values.address ?? ''}
            maxLength={255}
            autoComplete="street-address"
            placeholder="주소"
            fieldClassName={variant === 'detail' ? styles.detailField : styles.defaultField}
            className={variant === 'detail' ? styles.detailInput : styles.defaultInput}
            error={displayedErrors.address}
            onChange={(event) => setValue('address', event.target.value)}
          />
          {onSelectLocation !== undefined && (
            <Button type="button" variant="secondary" fullWidth onClick={onSelectLocation}>
              {values.latitude == null ? '지도에서 위치 선택' : '선택한 위치 바꾸기'}
            </Button>
          )}
          {values.latitude != null && values.longitude != null && (
            <p className={styles.locationCoordinates}>
              선택 위치 {values.latitude.toFixed(5)}, {values.longitude.toFixed(5)}
            </p>
          )}
        </div>
      )}

      <div className={variant === 'detail' ? styles.detailMoneyFields : styles.moneyFields}>
        <MoneyField
          id="property-deposit"
          name="depositAmount"
          label="보증금"
          requirement={mode === 'registration' ? '필수' : '선택'}
          value={values.depositAmount}
          autoComplete="off"
          placeholder="0"
          fieldClassName={variant === 'detail' ? styles.detailField : styles.defaultField}
          className={variant === 'detail' ? styles.detailInput : styles.defaultInput}
          error={displayedErrors.depositAmount}
          onValueChange={(value) => setValue('depositAmount', value)}
        />

        <MoneyField
          id="property-rent"
          name="monthlyRentAmount"
          label="월세"
          requirement={mode === 'registration' ? '필수' : '선택'}
          value={values.monthlyRentAmount}
          autoComplete="off"
          placeholder="0"
          fieldClassName={variant === 'detail' ? styles.detailField : styles.defaultField}
          className={variant === 'detail' ? styles.detailInput : styles.defaultInput}
          error={displayedErrors.monthlyRentAmount}
          onValueChange={(value) => setValue('monthlyRentAmount', value)}
        />
      </div>

      {mode === 'registration' ? null : variant === 'detail' ? (
        <TextAreaField
          id="property-source"
          name="discoverySource"
          label="확인한 곳"
          value={values.discoverySource}
          maxLength={500}
          rows={3}
          placeholder="URL, 앱 이름 또는 중개사 정보를 입력해 주세요."
          fieldClassName={styles.detailField}
          className={styles.detailInput}
          error={displayedErrors.discoverySource}
          helpText="선택 입력"
          onChange={(event) => setValue('discoverySource', event.target.value)}
        />
      ) : (
        <TextField
          id="property-source"
          name="discoverySource"
          label="확인한 곳"
          requirement="선택"
          value={values.discoverySource}
          maxLength={500}
          autoComplete="off"
          placeholder="URL, 앱 이름 또는 중개사 정보"
          fieldClassName={styles.defaultField}
          className={styles.defaultInput}
          error={displayedErrors.discoverySource}
          onChange={(event) => setValue('discoverySource', event.target.value)}
        />
      )}

      {formNotice !== null && formNotice !== undefined && <InlineNotice>{formNotice}</InlineNotice>}
      {mutationError !== null && (
        <InlineNotice tone="error">{getPropertyErrorMessage(mutationError)} 입력값은 그대로 유지됩니다.</InlineNotice>
      )}

      {embedded ? (
        <Button type="submit" variant="soft" fullWidth isLoading={isSubmitting} loadingLabel="저장 중…">
          {submitLabel}
        </Button>
      ) : (
        <BottomActionArea>
          <Button type="submit" variant="soft" fullWidth isLoading={isSubmitting} loadingLabel="저장 중…">
            {submitLabel}
          </Button>
        </BottomActionArea>
      )}
    </form>
  );
};

const styles = {
  // 다른 요소의 선택자에서 `.PropertyForm-form`로 가리킨다.
  form: cx(
    css`
      label: PropertyForm-form;
      display: flex;
      min-height: calc(100dvh - var(--bottom-navigation-height) - var(--app-bar-height) - 4.5rem);
      flex-direction: column;
      gap: 0.8rem;
      padding-bottom: 1rem;

      & > :last-child {
        margin-top: auto;
      }
    `,
    'PropertyForm-form',
  ),

  defaultField: css`
    label: PropertyForm-defaultField;
    gap: 0.3rem;

    & > label {
      font-size: 0.78rem;
    }
  `,

  defaultInput: css`
    label: PropertyForm-defaultInput;

    .PropertyForm-form & {
      min-height: 2.55rem;
      padding: 0.55rem 0.7rem;
      font-size: 0.78rem;
    }

    .PropertyForm-form textarea& {
      min-height: 4.75rem;
    }
  `,

  moneyFields: css`
    label: PropertyForm-moneyFields;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  `,

  // 다른 요소의 선택자에서 `.PropertyForm-locationFields`로 가리킨다.
  locationFields: cx(
    css`
      label: PropertyForm-locationFields;
      display: grid;
      gap: 0.65rem;
    `,
    'PropertyForm-locationFields',
  ),

  locationCoordinates: css`
    label: PropertyForm-locationCoordinates;
    margin: 0;
    color: var(--color-muted);
    font-size: 0.72rem;
    text-align: center;
  `,

  // 다른 요소의 선택자에서 `.PropertyForm-detailForm`로 가리킨다.
  detailForm: cx(
    css`
      label: PropertyForm-detailForm;

      & .PropertyForm-locationFields {
        margin: 0.75rem 0;
      }

      & {
        gap: 0;
      }
    `,
    'PropertyForm-detailForm',
  ),

  detailMoneyFields: css`
    label: PropertyForm-detailMoneyFields;
    display: contents;
  `,

  detailField: css`
    label: PropertyForm-detailField;
    grid-template-columns: 5.25rem minmax(0, 1fr);
    align-items: start;
    gap: 0.25rem 0.75rem;
    padding: 0.65rem 0;

    & > label {
      padding-top: 0.75rem;
      color: var(--color-muted);
      font-size: 0.78rem;
    }

    & > div {
      min-width: 0;
    }

    & > p {
      grid-column: 2;
    }

    @media (max-width: 340px) {
      grid-template-columns: 1fr;
    }

    @media (max-width: 340px) {
      & > label {
        padding-top: 0;
      }
    }

    @media (max-width: 340px) {
      & > p {
        grid-column: 1;
      }
    }
  `,

  detailInput: css`
    label: PropertyForm-detailInput;

    .PropertyForm-detailForm & {
      min-height: 2.15rem;
      padding: 0.35rem 0.55rem;
      border-color: transparent;
      background: var(--color-surface);
      font-size: 0.76rem;
      font-weight: 650;
    }

    .PropertyForm-detailForm textarea& {
      min-height: 5.5rem;
      font-size: 0.82rem;
      font-weight: 650;
    }

    .PropertyForm-detailForm &:hover {
      background: var(--color-surface-neutral);
    }

    .PropertyForm-detailForm &:focus,
    .PropertyForm-detailForm &:focus-visible {
      border: 1px solid var(--color-primary);
      border-color: var(--color-primary);
      background: var(--color-surface);
      outline: 0 !important;
      box-shadow: none;
    }
  `,
};

export default PropertyForm;
