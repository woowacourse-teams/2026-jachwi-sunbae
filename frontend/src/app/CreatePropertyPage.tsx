import { useNavigate } from 'react-router-dom';
import { ApiError } from '../apis/apiClient';
import PageHeading from '../components/PageHeading';
import PropertyForm from '../components/PropertyForm';
import RegistrationStepper from '../components/RegistrationStepper';
import AppBar from '../components/ui/AppBar';
import { useCreateProperty } from '../hooks/query/usePropertyMutations';
import type { PublicConfig } from '../types/PublicConfig';
import styles from './CreatePropertyPage.module.css';

type CreatePropertyPageProps = { config: PublicConfig };

const CreatePropertyPage = ({ config }: CreatePropertyPageProps) => {
  const navigate = useNavigate();
  const createMutation = useCreateProperty(config);
  const mutationError = createMutation.error instanceof ApiError ? createMutation.error : null;

  return (
    <main className={styles.page}>
      <AppBar title="새 매물 등록" backTo="/properties" backLabel="매물 목록으로 돌아가기" />
      <div className={styles.content}>
        <RegistrationStepper currentStep={1} />
        <PageHeading title="매물 기본 정보를 입력해 주세요" description="나중에 알아보기 쉬운 정보부터 기록해요." />
        <PropertyForm
          initialValues={{ name: '', depositAmount: '', monthlyRentAmount: '', discoverySource: '' }}
          submitLabel="매물 등록"
          isSubmitting={createMutation.isPending}
          mutationError={mutationError}
          cancelTo="/properties"
          onSubmit={(input) => {
            void createMutation
              .mutateAsync(input)
              .then((created) => navigate(`/properties/${created.propertyId}`, { replace: true }))
              .catch(() => undefined);
          }}
        />
      </div>
    </main>
  );
};

export default CreatePropertyPage;
