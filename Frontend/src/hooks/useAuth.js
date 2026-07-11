import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { authApi } from '../api/endpoints';
import { loginSuccess, logout as logoutAction, updateRole } from '../actions/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const { user, token, isAuthenticated, role, onboarding } = useSelector((s) => s.auth);

  const afterAuth = (res) => {
    const u = res.data?.user ?? res.data?.data;
    const t = res.data?.token;
    const onboarding = res.data?.onboarding ?? null;
    if (!u || !t) { toast.error('Invalid server response.'); return; }
    dispatch(loginSuccess({ user: u, token: t, onboarding }));
    return u;
  };

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      const u = afterAuth(res);
      if (!u) return;
      toast.success(`Welcome back, ${u.name?.split(' ')[0]}! 👋`);
      // Delayed so the caller can show a brief success state before navigating away.
      setTimeout(() => {
        navigate('/home');
      }, 600);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Login failed.'),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      // Don't call afterAuth because the user is not verified yet
      toast.success(res.data?.message || 'OTP sent to your email!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed.'),
  });

  const verifyRegistrationMutation = useMutation({
    mutationFn: authApi.verifyRegistration,
    onSuccess: (res) => {
      // Email OTP is the sole registration gate now — this is the token-issuing step.
      const u = afterAuth(res);
      if (!u) return;
      toast.success('Account verified and created successfully!');
      setTimeout(() => {
        navigate('/home');
      }, 600);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Verification failed.'),
  });

  const verifyMobileMutation = useMutation({
    mutationFn: authApi.verifyMobile,
    onSuccess: (res) => {
      // Step 2 done (Mobile verified), now we get the token
      const u = afterAuth(res);
      if (!u) return;
      toast.success('Account verified and created successfully!');
      setTimeout(() => {
        navigate('/home');
      }, 600);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Mobile verification failed.'),
  });

  const socialMutation = useMutation({
    mutationFn: authApi.social,
    onSuccess: (res) => {
      const u = afterAuth(res);
      if (!u) return;
      toast.success(`Welcome, ${u.name?.split(' ')[0]}!`);
      navigate('/home');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Social login failed.'),
  });

  const assignRoleMutation = useMutation({
    mutationFn: authApi.assignRole,
    onSuccess: (_, roleArg) => {
      dispatch(updateRole(roleArg.toUpperCase()));
      toast.success('Role set!');
      navigate('/home');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to set role.'),
  });

  const logout = () => { dispatch(logoutAction()); qc.clear(); navigate('/auth'); };

  return {
    user, token, isAuthenticated, role, onboarding,
    login:        loginMutation.mutate,
    isLoggingIn:  loginMutation.isPending,
    isLoginSuccess: loginMutation.isSuccess,
    register:     registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    verifyRegistration: verifyRegistrationMutation.mutate,
    isVerifyingRegistration: verifyRegistrationMutation.isPending,
    isVerifyRegistrationSuccess: verifyRegistrationMutation.isSuccess,
    verifyMobile: verifyMobileMutation.mutate,
    isVerifyingMobile: verifyMobileMutation.isPending,
    isVerifyMobileSuccess: verifyMobileMutation.isSuccess,
    socialLogin:  socialMutation.mutate,
    isSocialLoading: socialMutation.isPending,
    assignRole:   assignRoleMutation.mutate,
    isAssigning:  assignRoleMutation.isPending,
    logout,
  };
};