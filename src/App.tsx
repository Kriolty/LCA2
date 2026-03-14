import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';
import { Help } from './pages/Help';
import { MyLeads } from './pages/client/MyLeads';
import { TerritorySettings } from './pages/client/TerritorySettings';
import { Auctions } from './pages/client/Auctions';
import { DealPipeline } from './pages/client/DealPipeline';
import { Appointments } from './pages/client/Appointments';
import { SubscriptionManagement } from './pages/client/SubscriptionManagement';
import { UsageReports } from './pages/client/UsageReports';
import { OnboardingWizard } from './pages/client/OnboardingWizard';
import { WebhookManagement } from './pages/client/WebhookManagement';
import { DataExport } from './pages/client/DataExport';
import { ReferralProgram } from './pages/client/ReferralProgram';
import { QualityDisputes } from './pages/client/QualityDisputes';
import { Pipeline } from './pages/client/Pipeline';

function App() {
  const { user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading state while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

        {/* Protected client routes */}
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/dashboard/my-leads" element={user ? <MyLeads /> : <Navigate to="/login" />} />
        <Route path="/dashboard/territory" element={user ? <TerritorySettings /> : <Navigate to="/login" />} />
        <Route path="/dashboard/auctions" element={user ? <Auctions /> : <Navigate to="/login" />} />
        <Route path="/dashboard/pipeline" element={user ? <DealPipeline /> : <Navigate to="/login" />} />
        <Route path="/dashboard/pipeline-view" element={user ? <Pipeline /> : <Navigate to="/login" />} />
        <Route path="/dashboard/appointments" element={user ? <Appointments /> : <Navigate to="/login" />} />
        <Route path="/dashboard/subscription" element={user ? <SubscriptionManagement /> : <Navigate to="/login" />} />
        <Route path="/dashboard/usage" element={user ? <UsageReports /> : <Navigate to="/login" />} />
        <Route path="/dashboard/onboarding" element={user ? <OnboardingWizard /> : <Navigate to="/login" />} />
        <Route path="/dashboard/webhooks" element={user ? <WebhookManagement /> : <Navigate to="/login" />} />
        <Route path="/dashboard/data-export" element={user ? <DataExport /> : <Navigate to="/login" />} />
        <Route path="/dashboard/referrals" element={user ? <ReferralProgram /> : <Navigate to="/login" />} />
        <Route path="/dashboard/quality-disputes" element={user ? <QualityDisputes /> : <Navigate to="/login" />} />
        <Route path="/dashboard/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/dashboard/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/dashboard/help" element={user ? <Help /> : <Navigate to="/login" />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
