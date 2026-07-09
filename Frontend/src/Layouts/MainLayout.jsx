import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { loginSuccess } from '../actions/authSlice';
import api from '../services/api';

const MainLayout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((s) => s.auth);

  // Silently refresh user data from DB on every page load
  // This ensures avatar, isKycVerified, etc. are always fresh from server
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    api.get('/auth/me')
      .then((res) => {
        const freshUser = res.data?.data ?? res.data?.user;
        if (freshUser) {
          dispatch(loginSuccess({ user: freshUser, token }));
        }
      })
      .catch(() => {
        // Silently fail — don't logout user on network error
      });
  }, [isAuthenticated]); // eslint-disable-line

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;