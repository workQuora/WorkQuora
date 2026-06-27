import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleGuard = ({ children, allowedRole }) => {
  const { isAuthenticated, role } = useSelector((s) => s.auth);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!role) return <Navigate to="/auth/select-role" replace />;
  if (allowedRole && role?.toUpperCase() !== allowedRole?.toUpperCase()) {
    return <Navigate to={role.toLowerCase() === 'client' ? '/client/dashboard' : '/freelancer/dashboard'} replace />;
  }
  return children;
};

export default RoleGuard;