import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { loginSuccess } from '../actions/authSlice';
import api from '../services/api';

const MainLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, token } = useSelector((s) => s.auth);

  // Silently refresh user data from DB on every page load
  // This ensures avatar, isKycVerified, etc. are always fresh from server
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    api.get('/auth/me')
      .then((res) => {
        const freshUser = res.data?.data ?? res.data?.user;
        const onboarding = res.data?.onboarding;
        if (freshUser) {
          dispatch(loginSuccess({ user: freshUser, token, onboarding }));
        }
      })
      .catch(() => {
        // Silently fail
      });
  }, [isAuthenticated]); // eslint-disable-line

  // Reset scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full">
      <Navbar />
      <main className="flex-1 w-full">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
