import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../actions/authSlice';
import { profileApi } from '../api/endpoints';

export const useProfile = () => {
  const qc = useQueryClient();
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);

  const useGetProfile = () => useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.me().then((r) => r.data?.data ?? r.data),
  });

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: profileApi.update,
    onSuccess: (res) => {
      toast.success('Profile updated!');
      qc.invalidateQueries({ queryKey: ['profile'] });
      // Single source of truth for syncing the edited fields into Redux, so
      // every consumer (Navbar, dashboards, etc.) reflects the change
      // immediately — no caller needs to dispatch this itself anymore.
      const updated = res?.data?.data;
      if (updated && token) {
        dispatch(loginSuccess({ user: { ...user, ...updated }, token }));
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const { mutate: uploadPhoto, isPending: isUploading } = useMutation({
    mutationFn: profileApi.uploadPhoto,
    onSuccess: (res) => {
      toast.success('Photo updated!');
      qc.invalidateQueries({ queryKey: ['profile'] });
      const newPhoto = res?.data?.profilePic ?? res?.profilePic;
      if (newPhoto && token) {
        dispatch(loginSuccess({ user: { ...user, profilePic: newPhoto }, token }));
      }
    },
    onError: () => toast.error('Photo upload failed.'),
  });

  const { mutate: deletePhoto, isPending: isDeletingPhoto } = useMutation({
    mutationFn: profileApi.deletePhoto,
    onSuccess: () => {
      toast.success('Photo removed');
      qc.invalidateQueries({ queryKey: ['profile'] });
      if (token) dispatch(loginSuccess({ user: { ...user, profilePic: null }, token }));
    },
    onError: () => toast.error('Failed to remove photo.'),
  });

  return { useGetProfile, updateProfile, isUpdating, uploadPhoto, isUploading, deletePhoto, isDeletingPhoto };
};