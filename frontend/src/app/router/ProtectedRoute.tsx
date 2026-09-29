import { Navigate, Outlet } from 'react-router-dom';
import { ApiError, getSafeApiErrorMessage } from '../../features/auth/api/apiClient';
import StatusPanel from '../../shared/ui/status-panel/StatusPanel';
import { Button } from '../../shared/ui/button/Button';
import ContentState from '../../shared/ui/content-state/ContentState';
import { useCurrentMember } from '../../features/auth/api/useCurrentMember';
import { useAuthentication } from '../../features/auth/model/useAuthentication';
import useDelayedLoading from '../../shared/lib/hooks/useDelayedLoading';
import type { PublicConfig } from '../../shared/config/publicConfigTypes';

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
