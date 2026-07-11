import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import { authApi } from '../../../api/endpoints';
import { logout } from '../../../actions/authSlice';
import { Card, SectionHeader, Button } from '../../../components/ui';

const DangerZoneSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const logoutAllMutation = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => toast.success('Logged out of all devices'),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to logout all devices'),
  });

  const deleteMutation = useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      toast.success('Account deleted');
      dispatch(logout());
      navigate('/auth');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete account'),
  });

  return (
    <div className="space-y-4">
      <SectionHeader icon={AlertTriangle} title="Danger zone" subtitle="Irreversible account actions" />

      <Card className="border-danger/20 bg-danger/5">
        <h3 className="text-danger font-bold text-sm mb-2">Logout All Devices</h3>
        <p className="text-sm text-muted-foreground mb-4">Sign out of every device where you're currently logged in.</p>
        <Button variant="secondary" onClick={() => logoutAllMutation.mutate()} isLoading={logoutAllMutation.isPending}>
          {!logoutAllMutation.isPending && 'Logout All Devices'}
        </Button>
      </Card>

      <Card className="border-danger/20 bg-danger/5">
        <h3 className="text-danger font-bold text-sm mb-2">Delete Account</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This will permanently anonymize your account data. Active jobs must be completed or cancelled first.
        </p>

        {!showDeleteConfirm ? (
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete My Account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Type DELETE to confirm:</p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-danger/30 bg-white dark:bg-zinc-800/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger transition-colors"
              placeholder="Type DELETE here"
            />
            <div className="flex gap-3">
              <Button
                variant="danger"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => deleteMutation.mutate()}
                isLoading={deleteMutation.isPending}
              >
                {!deleteMutation.isPending && 'Confirm Delete'}
              </Button>
              <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DangerZoneSection;
