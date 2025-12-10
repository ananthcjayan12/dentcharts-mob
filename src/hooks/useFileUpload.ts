import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileUploadService } from '../api/services';
import { queryKeys, mutationKeys, invalidateQueriesHelper } from '../api/queryClient';
import toast from 'react-hot-toast';

/**
 * Hook for uploading files
 */
export const useUploadFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: mutationKeys.files.upload(),
        mutationFn: (params: {
            file: File;
            options: {
                file_category: string;
                description?: string;
                reference_doctype?: string;
                reference_name?: string;
                is_private?: boolean;
            };
            onProgress?: (progress: number) => void;
        }) => fileUploadService.uploadFile(params.file, params.options, params.onProgress),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            toast.success('File uploaded successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to upload file');
        },
    });
};

/**
 * Hook for listing files
 */
export const useFiles = (params?: {
    file_category?: string;
    reference_doctype?: string;
    reference_name?: string;
    enabled?: boolean;
}) => {
    return useQuery({
        queryKey: queryKeys.files.list(params || {}),
        queryFn: () => fileUploadService.listFiles({
            file_category: params?.file_category,
            reference_doctype: params?.reference_doctype,
            reference_name: params?.reference_name,
            limit: 100,
        }),
        enabled: params?.enabled !== false,
        staleTime: 3 * 60 * 1000, // 3 minutes
    });
};

/**
 * Hook for getting appointment files
 */
export const useAppointmentFiles = (appointmentId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: queryKeys.files.list({ reference_doctype: 'Appointment', reference_name: appointmentId }),
        queryFn: () => fileUploadService.listFiles({
            reference_doctype: 'Patient Appointment',
            reference_name: appointmentId,
            limit: 100,
        }),
        enabled: enabled && !!appointmentId,
        staleTime: 3 * 60 * 1000,
    });
};

/**
 * Hook for deleting files
 */
export const useDeleteFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: mutationKeys.files.delete(''),
        mutationFn: (fileId: string) => fileUploadService.deleteFile(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            toast.success('File deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete file');
        },
    });
};
