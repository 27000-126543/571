import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, ReactNode } from 'react';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TeachingBuildingPage from './pages/TeachingBuildingPage';
import LibraryPage from './pages/LibraryPage';
import CanteenPage from './pages/CanteenPage';
import BusPage from './pages/BusPage';
import VisitorPage from './pages/VisitorPage';
import DevicePage from './pages/DevicePage';
import ApprovalCenterPage from './pages/ApprovalCenterPage';
import ReportPage from './pages/ReportPage';
import OperationLogsPage from './pages/OperationLogsPage';

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

function RouteListener() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <RouteListener />
      <Routes>
        <Route
          path="/login"
          element={
            (() => {
              const { token } = useAuthStore();
              if (token) {
                return <Navigate to="/" replace />;
              }
              return <LoginPage />;
            })()
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teaching"
          element={
            <ProtectedRoute>
              <TeachingBuildingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/canteen"
          element={
            <ProtectedRoute>
              <CanteenPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bus"
          element={
            <ProtectedRoute>
              <BusPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/visitor"
          element={
            <ProtectedRoute>
              <VisitorPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/device"
          element={
            <ProtectedRoute>
              <DevicePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/approval"
          element={
            <ProtectedRoute>
              <ApprovalCenterPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <OperationLogsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
