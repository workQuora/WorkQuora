import React, { useEffect, Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom';
import { store } from './redux/store';
import { useAppStore } from './store/appStore';

// ── Layouts (NOT lazy — shell must render instantly) ──────────────────────────
import MainLayout from './Layouts/MainLayout';
import DashboardLayout from './Layouts/DashboardLayout';
import AdminLayout from './admin/components/AdminLayout';

// ── Auth pages (NOT lazy — entry points, must load instantly) ─────────────────
import Auth from './pages/Auth';
import Login from './features/auth/ui/Login';
import SelectRole from './features/auth/ui/SelectRole';

// ── Lazy-loaded public pages ──────────────────────────────────────────────────
const Landing               = lazy(() => import('./pages/Landing'));
const Discover              = lazy(() => import('./pages/Discover'));
const JobDetails            = lazy(() => import('./pages/JobDetails'));
const SearchPage            = lazy(() => import('./pages/SearchPage'));
const FreelancerPublicProfile = lazy(() => import('./pages/FreelancerPublicProfile'));
const InfoPage              = lazy(() => import('./pages/shared/InfoPage'));

// ── Lazy-loaded shared/protected pages ───────────────────────────────────────
const Messages              = lazy(() => import('./pages/shared/Messages'));
const Settings              = lazy(() => import('./pages/shared/Settings'));
const Wallet                = lazy(() => import('./pages/shared/Wallet'));

// ── Lazy-loaded client pages ──────────────────────────────────────────────────
const PostJob               = lazy(() => import('./pages/client/PostJob'));
const ClientJobs            = lazy(() => import('./pages/client/ClientJobs'));
const ClientDashboard       = lazy(() => import('./pages/client/Dashboard'));

// ── Lazy-loaded freelancer pages ──────────────────────────────────────────────
const FreelancerDashboard   = lazy(() => import('./pages/freelancer/Dashboard'));
const Profile               = lazy(() => import('./pages/freelancer/Profile'));
const Earnings              = lazy(() => import('./pages/freelancer/Earnings'));

// ── Lazy-loaded admin pages (heaviest — biggest gain) ─────────────────────────
const AdminLogin            = lazy(() => import('./admin/pages/AdminLogin'));
const AdminDashboard        = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminUsers            = lazy(() => import('./admin/pages/AdminUsers'));
const AdminTasks            = lazy(() => import('./admin/pages/AdminTasks'));
const AdminPayments         = lazy(() => import('./admin/pages/AdminPayments'));
const AdminAnalytics        = lazy(() => import('./admin/pages/AdminAnalytics'));
const AdminAuditLogs        = lazy(() => import('./admin/pages/AdminAuditLogs'));
const AdminSettings         = lazy(() => import('./admin/pages/AdminSettings'));
const AdminAds              = lazy(() => import('./admin/pages/AdminAds'));
const Maintenance           = lazy(() => import('./pages/Maintenance'));

// ── Shared Suspense fallback (full-screen spinner) ────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

/* ── Route Guards ─────────────────────────────────── */
const guestLoader = () => {
  const { isAuthenticated, role } = store.getState().auth;
  if (isAuthenticated) {
    const r = role?.toLowerCase();
    if (r === 'client') return redirect('/client/dashboard');
    if (r === 'freelancer') return redirect('/freelancer/dashboard');
  }
  return null;
};

const clientLoader = () => {
  const { isAuthenticated, role } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  if (role?.toLowerCase() !== 'client') return redirect('/freelancer/dashboard');
  return null;
};

const freelancerLoader = () => {
  const { isAuthenticated, role } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  if (role?.toLowerCase() !== 'freelancer') return redirect('/client/dashboard');
  return null;
};

const authLoader = () => {
  const { isAuthenticated } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  return null;
};

const adminLoader = () => {
  const { admin } = store.getState().adminAuth;
  if (!admin) return redirect('/admin/login');
  return null;
};

const adminGuestLoader = () => {
  const { admin } = store.getState().adminAuth;
  if (admin) return redirect('/admin/dashboard');
  return null;
};

/* ── Router ───────────────────────────────────────── */
const router = createBrowserRouter([
  // Public routes (with Navbar)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'discover', element: <Discover /> },
      { path: 'job/:id', element: <JobDetails /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'freelancer/:userId', element: <FreelancerPublicProfile /> },

      // Protected shared routes
      { path: 'profile', loader: authLoader, element: <Profile /> },
      { path: 'shared/messages', loader: authLoader, element: <Messages /> },
      { path: 'shared/settings', loader: authLoader, element: <Settings /> },
      { path: 'shared/wallet',   loader: authLoader, element: <Wallet /> },
      { path: 'freelancer/earnings', loader: freelancerLoader, element: <Earnings /> },
      { path: 'client/post-job', loader: clientLoader, element: <PostJob /> },
      { path: 'info/:slug', element: <InfoPage /> },
    ],
  },

  // Auth routes (eager — entry points)
  { path: '/auth',             element: <Auth />,       loader: guestLoader },
  { path: '/auth/login',       element: <Login />,      loader: guestLoader },
  { path: '/auth/select-role', element: <SelectRole />, loader: authLoader },

  // Client dashboard (sidebar layout)
  {
    path: '/client',
    element: <DashboardLayout />,
    loader: clientLoader,
    children: [
      { path: 'dashboard', element: <ClientDashboard /> },
      { path: 'jobs',      element: <ClientJobs /> },
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

  // Admin Portal Routes
  { path: '/admin/login', element: <AdminLogin />, loader: adminGuestLoader },
  {
    path: '/admin',
    element: <AdminLayout />,
    loader: adminLoader,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'clients', element: <AdminUsers roleProp="CLIENT" /> },
      { path: 'freelancers', element: <AdminUsers roleProp="FREELANCER" /> },
      { path: 'tasks', element: <AdminTasks /> },
      { path: 'payments', element: <AdminPayments /> },
      { path: 'analytics', element: <AdminAnalytics /> },
      { path: 'ads', element: <AdminAds /> },
      { path: 'audit-logs', element: <AdminAuditLogs /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },

  {
    path: '/maintenance',
    element: <Maintenance />
  },

  // 404
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-extrabold text-primary mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-4">This route does not exist.</p>
        <a href="/" className="text-xs font-bold px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">Go Home</a>
      </div>
    ),
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