import React, { useEffect, Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, redirect, Outlet, Navigate } from 'react-router-dom';
import { store } from './redux/store';
import { useAppStore } from './store/appStore';

// ── Layouts (NOT lazy — shell must render instantly) ──────────────────────────
import MainLayout from './Layouts/MainLayout';
import DashboardLayout from './Layouts/DashboardLayout';

// ── Auth pages (NOT lazy — entry points, must load instantly) ─────────────────
import Auth from './pages/Auth';
import Login from './features/auth/ui/Login';
import OnboardingOverlay from './components/OnboardingOverlay';

// ── Lazy-loaded public pages ──────────────────────────────────────────────────
const Landing               = lazy(() => import('./pages/Landing'));
const JobDetails            = lazy(() => import('./pages/JobDetails'));
const FreelancerPublicProfile = lazy(() => import('./pages/FreelancerPublicProfile'));
const InfoPage              = lazy(() => import('./pages/shared/InfoPage'));
const NotFound = lazy(() => import('./pages/shared/NotFound'));

// ── Lazy-loaded shared/protected pages ───────────────────────────────────────
const Messages              = lazy(() => import('./pages/shared/Messages'));
const Settings              = lazy(() => import('./pages/shared/Settings'));
const Wallet                = lazy(() => import('./pages/shared/Wallet'));
const Reviews               = lazy(() => import('./pages/shared/Reviews'));

// ── Lazy-loaded client pages ──────────────────────────────────────────────────
const PostJob               = lazy(() => import('./pages/client/PostJob'));
const ClientJobs            = lazy(() => import('./pages/client/ClientJobs'));
const ClientDashboard       = lazy(() => import('./pages/client/Dashboard'));
const ClientHistory         = lazy(() => import('./pages/client/ClientHistory'));

// ── Lazy-loaded freelancer pages ──────────────────────────────────────────────
const FreelancerDashboard   = lazy(() => import('./pages/freelancer/Dashboard'));
const Profile               = lazy(() => import('./pages/freelancer/Profile'));
const Earnings              = lazy(() => import('./pages/freelancer/Earnings'));

const Maintenance           = lazy(() => import('./pages/Maintenance'));

// ── Shared Suspense fallback (full-screen spinner) ────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

/* ── Route Guards ─────────────────────────────────── */
const guestLoader = () => {
  const { isAuthenticated } = store.getState().auth;
  if (isAuthenticated) {
    return redirect('/home');
  }
  return null;
};

const clientLoader = () => {
  const { isAuthenticated, role } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  if (!role) return redirect('/home');
  if (role?.toLowerCase() !== 'client') return redirect('/freelancer/dashboard');
  return null;
};

const freelancerLoader = () => {
  const { isAuthenticated, role } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  if (!role) return redirect('/home');
  if (role?.toLowerCase() !== 'freelancer') return redirect('/client/dashboard');
  return null;
};

const authLoader = () => {
  const { isAuthenticated } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  return null;
};

// Phase A: wallet withdrawal is freelancer-only — clients only fund escrow.
const freelancerOnlyLoader = () => {
  const { isAuthenticated, role } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  if (role?.toLowerCase() !== 'freelancer') return redirect('/home');
  return null;
};

/* ── Root layout ──────────────────────────────────────
   Wraps every route so OnboardingOverlay renders inside the
   router context (useNavigate requires a <Router> ancestor). */
const RootLayout = () => (
  <>
    <Outlet />
    <OnboardingOverlay />
  </>
);

/* ── Router ───────────────────────────────────────── */
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public routes (with Navbar)
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/auth" replace /> },
          { path: 'home', element: <Landing /> },
          { path: 'job/:id', element: <JobDetails /> },
          { path: 'freelancer/:userId', element: <FreelancerPublicProfile /> },

          // Protected shared routes
          { path: 'profile', loader: authLoader, element: <Profile /> },
          { path: 'shared/messages', loader: authLoader, element: <Messages /> },
          { path: 'shared/settings', loader: authLoader, element: <Settings /> },
          { path: 'shared/wallet',   loader: freelancerOnlyLoader, element: <Wallet /> },
          { path: 'reviews/:userId', loader: authLoader, element: <Reviews /> },
          { path: 'freelancer/earnings', loader: freelancerLoader, element: <Earnings /> },
          { path: 'client/post-job', loader: clientLoader, element: <PostJob /> },
          { path: 'info/:slug', element: <InfoPage /> },
        ],
      },

      // Auth routes (eager — entry points)
      { path: '/auth',             element: <Auth />,       loader: guestLoader },
      { path: '/auth/login',       element: <Login />,      loader: guestLoader },
      

      // Client dashboard (sidebar layout)
      {
        path: '/client',
        element: <DashboardLayout />,
        loader: clientLoader,
        children: [
          { path: 'dashboard', element: <ClientDashboard /> },
          { path: 'jobs',      element: <ClientJobs /> },
          { path: 'history',   element: <ClientHistory /> },
        ],
      },

      // Freelancer dashboard (sidebar layout)
      {
        path: '/freelancer',
        element: <DashboardLayout />,
        loader: freelancerLoader,
        children: [
          { path: 'dashboard', element: <FreelancerDashboard /> },
        ],
      },

      {
        path: '/maintenance',
        element: <Maintenance />
      },

      // 404
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

function App() {
  const { isMaintenanceMode, fetchMaintenanceConfig, GoToMaintenance } = useAppStore();

  useEffect(() => {
    // Fetch maintenance configurations from JSON file
    fetchMaintenanceConfig();

    // Bind global function for developers only in local development mode
    if (import.meta.env.DEV) {
      window.GoToMaintenance = GoToMaintenance;
    }
  }, [fetchMaintenanceConfig, GoToMaintenance]);

  // Intercept all routes if maintenance mode is active
  if (isMaintenanceMode) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Maintenance />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;