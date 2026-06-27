import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileApi } from '../api/endpoints';

export const useProfile = () => {
  const qc = useQueryClient();

  const useGetProfile = () => useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.me().then((r) => r.data?.data ?? r.data),
  });

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: profileApi.update,
    onSuccess: () => { toast.success('Profile updated!'); qc.invalidateQueries({ queryKey: ['profile'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const { mutate: uploadPhoto, isPending: isUploading } = useMutation({
    mutationFn: profileApi.uploadPhoto,
    onSuccess: () => { toast.success('Photo updated!'); qc.invalidateQueries({ queryKey: ['profile'] }); },
    onError: () => toast.error('Photo upload failed.'),
  });

  return { useGetProfile, updateProfile, isUpdating, uploadPhoto, isUploading };
};