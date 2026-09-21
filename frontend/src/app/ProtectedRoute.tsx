import { Navigate, Outlet } from 'react-router-dom';
import { ApiError, getSafeApiErrorMessage } from '../apis/apiClient';
import StatusPanel from '../components/StatusPanel';
import { Button } from '../components/ui/Button';
import ContentState from '../components/ui/ContentState';
import { useCurrentMember } from '../hooks/query/useCurrentMember';
import { useAuthentication } from '../hooks/useAuthentication';
import useDelayedLoading from '../hooks/ui/useDelayedLoading';
import type { PublicConfig } from '../types/PublicConfig';

type ProtectedRouteProps = {
  config: PublicConfig;
};

const ProtectedRoute = ({ config }: ProtectedRouteProps) => {
  const { session } = useAuthentication();
  const currentMember = useCurrentMember(config, session !== null);
  const isLoadingVisible = useDelayedLoading(currentMember.isPending);

  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  if (currentMember.isPending) {
    return isLoadingVisible ? <ContentState loading title="인증을 확인하고 있어요." /> : null;
  }

  if (currentMember.isError) {
    if (currentMember.error instanceof ApiError && currentMember.error.status === 401) {
      return <Navigate to="/login" replace />;
    }

    return (
      <StatusPanel
        title="회원 정보를 불러오지 못했어요"
        description={getSafeApiErrorMessage(currentMember.error)}
        tone="error"
        action={<Button onClick={() => void currentMember.refetch()}>다시 시도하기</Button>}
      />
    );
  }

  return <Outlet context={currentMember.data} />;
};

export default ProtectedRoute;
