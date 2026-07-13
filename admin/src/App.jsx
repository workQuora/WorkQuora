import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom';
import { store } from './store/store';
import AdminLayout from './components/AdminLayout';

const AdminLogin        = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers         = lazy(() => import('./pages/AdminUsers'));
const AdminKyc           = lazy(() => import('./pages/AdminKyc'));
const AdminDisputes      = lazy(() => import('./pages/AdminDisputes'));
const AdminTasks         = lazy(() => import('./pages/AdminTasks'));
const AdminPayments      = lazy(() => import('./pages/AdminPayments'));
const AdminAnalytics     = lazy(() => import('./pages/AdminAnalytics'));
const AdminAuditLogs     = lazy(() => import('./pages/AdminAuditLogs'));
const AdminSettings      = lazy(() => import('./pages/AdminSettings'));
const AdminAds           = lazy(() => import('./pages/AdminAds'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}>
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

/* ── Route Guards — same pattern as Frontend/src/App.jsx's loaders,
   reading the store directly since these run outside React. ────────── */
const adminLoader = () => {
  const { admin } = store.getState().adminAuth;
  if (!admin) return redirect('/login');
  return null;
};

const adminGuestLoader = () => {
  const { admin } = store.getState().adminAuth;
  if (admin) return redirect('/dashboard');
  return null;
};

const router = createBrowserRouter([
  { path: '/login', element: <AdminLogin />, loader: adminGuestLoader },
  {
    path: '/',
    element: <AdminLayout />,
    loader: adminLoader,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'clients', element: <AdminUsers roleProp="CLIENT" /> },
      { path: 'freelancers', element: <AdminUsers roleProp="FREELANCER" /> },
      { path: 'kyc', element: <AdminKyc /> },
      { path: 'disputes', element: <AdminDisputes /> },
      { path: 'tasks', element: <AdminTasks /> },
      { path: 'payments', element: <AdminPayments /> },
      { path: 'analytics', element: <AdminAnalytics /> },
      { path: 'ads', element: <AdminAds /> },
      { path: 'audit-logs', element: <AdminAuditLogs /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },
]);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
