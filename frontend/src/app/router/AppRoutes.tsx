import { lazy } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import LazyRouteBoundary from './LazyRouteBoundary';
import PropertyAppLayout from '../layouts/property-app-layout/PropertyAppLayout';
import { useAuthentication } from '../../features/auth/model/useAuthentication';
import { isChecklistStage } from '../../features/checklist/model/checklist';
import type { PublicConfig } from '../../shared/config/publicConfigTypes';
import LoginPage from '../../pages/login/LoginPage';
import ProtectedRoute from './ProtectedRoute';

const IntroPage = lazy(() => import('../../pages/intro/IntroPage'));
const PrivacyPage = lazy(() => import('../../pages/privacy/PrivacyPage'));
const NotFoundPage = lazy(() => import('../../pages/not-found/NotFoundPage'));
const PropertyListPage = lazy(() => import('../../pages/property-list/PropertyListPage'));
const CreatePropertyPage = lazy(() => import('../../pages/create-property/CreatePropertyPage'));
const PropertyDetailPage = lazy(() => import('../../pages/property-detail/PropertyDetailPage'));
const EditPropertyPage = lazy(() => import('../../pages/edit-property/EditPropertyPage'));
const PropertyPhotosPage = lazy(() => import('../../pages/property-photos/PropertyPhotosPage'));
const PropertyMemoPage = lazy(() => import('../../pages/property-memo/PropertyMemoPage'));
const ChecklistListPage = lazy(() => import('../../pages/checklist-list/ChecklistListPage'));
const CreateChecklistPage = lazy(() => import('../../pages/create-checklist/CreateChecklistPage'));
const ChecklistDetailPage = lazy(() => import('../../pages/checklist-detail/ChecklistDetailPage'));
const PropertyActiveChecklistPage = lazy(
  () => import('../../pages/property-active-checklist/PropertyActiveChecklistPage'),
);
const PropertyChecklistPage = lazy(() => import('../../pages/property-checklist/PropertyChecklistPage'));
const MyPage = lazy(() => import('../../pages/my/MyPage'));
const MapPage = lazy(() => import('../../pages/map/MapPage'));
const MapLocationSelectPage = lazy(() => import('../../pages/map-location-select/MapLocationSelectPage'));
const NearbyAnalysisPage = lazy(() => import('../../pages/nearby-analysis/NearbyAnalysisPage'));
const PropertyComparePage = lazy(() => import('../../pages/property-compare/PropertyComparePage'));
const UpcomingFeaturePage = lazy(() => import('../../pages/upcoming-feature/UpcomingFeaturePage'));

const lazyPage = (page: ReactNode) => <LazyRouteBoundary>{page}</LazyRouteBoundary>;

/** 예전 단계별 목록 주소(/checklists/ON_SITE 등)로 들어와도 단일 목록으로 보낸다. */
const ChecklistResourceRoute = ({ config }: { config: PublicConfig }) => {
  const resource = useParams().resource;
  if (isChecklistStage(resource)) {
    return <Navigate to="/checklists" replace />;
  }
  return <ChecklistDetailPage config={config} />;
};

type AppRoutesProps = {
  config: PublicConfig;
};

const LoginRoute = ({ config }: AppRoutesProps) => {
  const { session } = useAuthentication();

  if (session !== null) {
    return <Navigate to="/properties" replace />;
  }

  return <LoginPage config={config} />;
};

const AppRoutes = ({ config }: AppRoutesProps) => (
  <Routes>
    <Route path="/intro" element={lazyPage(<IntroPage />)} />
    <Route path="/privacy" element={lazyPage(<PrivacyPage />)} />
    <Route path="/login" element={<LoginRoute config={config} />} />
    <Route element={<ProtectedRoute config={config} />}>
      <Route element={<PropertyAppLayout />}>
        <Route index element={<Navigate to="/properties" replace />} />
        <Route path="/properties" element={lazyPage(<PropertyListPage config={config} />)} />
        <Route path="/properties/new" element={lazyPage(<CreatePropertyPage config={config} />)} />
        <Route path="/properties/:propertyId" element={lazyPage(<PropertyDetailPage config={config} />)} />

        <Route path="/properties/:propertyId/edit" element={lazyPage(<EditPropertyPage config={config} />)} />
        <Route path="/properties/:propertyId/photos" element={lazyPage(<PropertyPhotosPage config={config} />)} />
        <Route path="/properties/:propertyId/memo" element={lazyPage(<PropertyMemoPage config={config} />)} />
        <Route path="/properties/:propertyId/nearby" element={lazyPage(<NearbyAnalysisPage config={config} />)} />
        <Route
          path="/properties/:propertyId/active-checklists/:stage"
          element={lazyPage(<PropertyActiveChecklistPage config={config} />)}
        />
        <Route
          path="/properties/:propertyId/checklists/:propertyChecklistId"
          element={lazyPage(<PropertyChecklistPage config={config} />)}
        />
        <Route path="/checklists" element={lazyPage(<ChecklistListPage config={config} />)} />
        <Route path="/checklists/new" element={lazyPage(<CreateChecklistPage config={config} />)} />
        <Route path="/checklists/:resource" element={lazyPage(<ChecklistResourceRoute config={config} />)} />
        <Route path="/me" element={lazyPage(<MyPage config={config} />)} />
        <Route path="/map" element={lazyPage(<MapPage config={config} />)} />
        <Route path="/map/select-location" element={lazyPage(<MapLocationSelectPage config={config} />)} />
        <Route path="/compare" element={lazyPage(<PropertyComparePage config={config} />)} />
        <Route path="/export" element={lazyPage(<UpcomingFeaturePage feature="export" />)} />
        <Route path="/tips" element={lazyPage(<UpcomingFeaturePage feature="tips" />)} />
      </Route>
    </Route>
    <Route path="*" element={lazyPage(<NotFoundPage />)} />
  </Routes>
);

export default AppRoutes;
