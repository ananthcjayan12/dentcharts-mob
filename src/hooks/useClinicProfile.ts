import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicProfileService, ClinicProfile } from '../api/services/clinicProfile';
import { useClinic } from '../contexts/ClinicContext';
import toast from 'react-hot-toast';

export const useClinicProfile = () => {
    const { clinicId, profile, isLoading, error, updateProfile, refetchProfile } = useClinic();
    const queryClient = useQueryClient();

    const uploadLogoMutation = useMutation({
        mutationFn: (file: File) => {
            if (!clinicId) throw new Error('No active clinic');
            return clinicProfileService.uploadLogo(clinicId, file);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinicProfile', clinicId] });
            toast.success('Logo uploaded successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to upload logo');
        }
    });

    const uploadDocumentMutation = useMutation({
        mutationFn: ({ type, file }: { type: 'signature' | 'seal', file: File }) => {
            if (!clinicId) throw new Error('No active clinic');
            return clinicProfileService.uploadDocument(clinicId, type, file);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinicProfile', clinicId] });
            toast.success('Document uploaded successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to upload document');
        }
    });

    return {
        profile,
        isLoading,
        error,
        updateProfile,
        refetchProfile,
        uploadLogo: uploadLogoMutation.mutateAsync,
        isUploadingLogo: uploadLogoMutation.isPending,
        uploadDocument: uploadDocumentMutation.mutateAsync,
        isUploadingDocument: uploadDocumentMutation.isPending,
    };
};
