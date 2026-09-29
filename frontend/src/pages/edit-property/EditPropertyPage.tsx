import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../features/auth/api/apiClient';
import type { UpdatePropertyRequestDto } from '../../features/property/api/dtos/PropertyDto';
import { getPropertyErrorMessage } from '../../features/property/api/propertyErrorMessages';
import PropertyForm from '../../features/property/ui/property-form/PropertyForm';
import TopNavigation from '../../shared/ui/top-navigation/TopNavigation';
import { usePropertyDetail } from '../../features/property/api/useProperties';
import { useUpdateProperty } from '../../features/property/api/usePropertyMutations';
import type { PublicConfig } from '../../shared/config/publicConfigTypes';
import { formatAmountForInput } from '../../features/property/lib/propertyForm';
import { parsePositiveId } from '../../features/property/lib/propertyFormat';
import styles from './EditPropertyPage.module.css';
import ContentState from '../../shared/ui/content-state/ContentState';

type EditPropertyPageProps = { config: PublicConfig };

const EditPropertyPage = ({ config }: EditPropertyPageProps) => {
  const { propertyId: propertyIdParam } = useParams();
  const propertyId = parsePositiveId(propertyIdParam);

  if (propertyId === null) {
    return (
      <ContentState title="올바른 매물 주소가 아니에요.">
        <Link to="/properties">매물 목록으로 돌아가기</Link>
      </ContentState>
    );
  }

  return <ResolvedEditPropertyPage config={config} propertyId={propertyId} />;
};

const ResolvedEditPropertyPage = ({ config, propertyId }: { config: PublicConfig; propertyId: number }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const property = usePropertyDetail(config, propertyId);
  const updateMutation = useUpdateProperty(config, propertyId);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  if (property.isPending) return <ContentState loading title="매물 정보를 불러오는 중이에요." />;
  if (property.isError)
    return (
      <ContentState
        tone="error"
        title={
          property.error instanceof ApiError && property.error.code === 'PROPERTY_NOT_FOUND'
            ? '매물을 찾을 수 없어요.'
            : '매물 정보를 불러오지 못했어요.'
        }
        description={getPropertyErrorMessage(property.error)}
      >
        <Link to="/properties">매물 목록으로 돌아가기</Link>
      </ContentState>
    );

  const initial = property.data;
  const mutationError = updateMutation.error instanceof ApiError ? updateMutation.error : null;
  const selectedLocation =
    (location.state as {
      address?: string;
      latitude?: number;
      longitude?: number;
    } | null) ?? {};

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <TopNavigation
          title="매물 정보 수정"
          backTo={`/properties/${propertyId}`}
          backLabel="매물 정보 수정 닫기"
          navigationIcon="close"
        />
        <h1 className={styles.heading}>매물 정보를 수정해주세요</h1>
        <PropertyForm
          initialValues={{
            name: initial.name,
            depositAmount: formatAmountForInput(initial.depositAmount),
            monthlyRentAmount: formatAmountForInput(initial.monthlyRentAmount),
            discoverySource: initial.discoverySource.value,
            address: selectedLocation.address ?? initial.location.address ?? '',
            latitude: selectedLocation.latitude ?? initial.location.latitude,
            longitude: selectedLocation.longitude ?? initial.location.longitude,
          }}
          submitLabel="변경사항 저장"
          isSubmitting={updateMutation.isPending}
          mutationError={mutationError}
          formNotice={formNotice}
          variant="detail"
          onSelectLocation={() =>
            navigate('/map/select-location', {
              state: {
                returnTo: `/properties/${propertyId}/edit`,
                initialLocation:
                  initial.location.latitude === null || initial.location.longitude === null
                    ? undefined
                    : {
                        address: initial.location.address,
                        roadAddress: null,
                        jibunAddress: null,
                        latitude: initial.location.latitude,
                        longitude: initial.location.longitude,
                      },
              },
            })
          }
          onSubmit={(input) => {
            const changes: UpdatePropertyRequestDto = {
              ...input,
              availableMoveInDate: initial.availableMoveInDate,
              maintenanceFeeAmount: initial.maintenanceFeeAmount,
              visitScheduledAt: initial.visitScheduledAt,
              roomOptions: initial.roomOptions,
              utilityOptions: initial.utilityOptions,
            };
            setFormNotice(null);
            void updateMutation
              .mutateAsync(changes)
              .then(() => navigate(`/properties/${propertyId}`, { replace: true }))
              .catch(() => undefined);
          }}
        />
      </div>
    </main>
  );
};

export default EditPropertyPage;
