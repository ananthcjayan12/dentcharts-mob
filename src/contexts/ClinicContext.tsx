import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { clinicProfileService, ClinicProfile } from '../api/services/clinicProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getActiveClinic, getUserClinics } from '../utils/storage';

interface ClinicContextType {
    clinicId: string | null;
    profile: ClinicProfile | null;
    isLoading: boolean;
    error: any;
    updateProfile: (section: keyof ClinicProfile, data: any) => Promise<void>;
    refetchProfile: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const useClinic = () => {
    const context = useContext(ClinicContext);
    if (context === undefined) {
        throw new Error('useClinic must be used within a ClinicProvider');
    }
    return context;
};

interface ClinicProviderProps {
    children: ReactNode;
}

export const ClinicProvider: React.FC<ClinicProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    console.log('👤 ClinicProvider - user:', user);
    console.log('👤 ClinicProvider - user.active_clinic:', user?.active_clinic);
    console.log('👤 ClinicProvider - user.primary_clinic:', user?.primary_clinic);
    console.log('👤 ClinicProvider - user.clinics:', user?.clinics);

    // Extract clinic ID safely
    // Priorities: 
    // 1. active_clinic from user object
    // 2. primary_clinic from user object
    // 3. clinics[0] from user object
    // 4. FALLBACK: getActiveClinic() from localStorage
    // 5. FALLBACK: getUserClinics()[0] from localStorage
    let clinicId = user?.active_clinic || user?.primary_clinic || (user?.clinics && user.clinics.length > 0 ? user.clinics[0] : null);

    // Fallback to localStorage if user object doesn't have clinic data
    if (!clinicId) {
        const storedActiveClinic = getActiveClinic();
        const storedClinics = getUserClinics();
        clinicId = storedActiveClinic || (storedClinics && storedClinics.length > 0 ? storedClinics[0] : null);
        console.log('🔄 Using fallback from localStorage - active:', storedActiveClinic, 'clinics:', storedClinics);
    }

    console.log('🏥 ClinicProvider - extracted clinicId:', clinicId);

    const { data: profile, isLoading, error, refetch } = useQuery({
        queryKey: ['clinicProfile', clinicId],
        queryFn: () => clinicId ? clinicProfileService.getClinicProfile(clinicId) : null,
        enabled: !!clinicId,
        staleTime: 0, // Always fetch fresh data
        gcTime: 0, // Don't cache
        refetchOnMount: 'always', // Always refetch when mounted
    });

    const updateProfileMutation = useMutation({
        mutationFn: async ({ section, data }: { section: keyof ClinicProfile, data: any }) => {
            if (!clinicId) throw new Error('No active clinic');

            const payload = { ...data, clinic: clinicId };

            switch (section) {
                case 'basic_info':
                    return clinicProfileService.updateBasicInfo(payload);
                case 'address':
                    return clinicProfileService.updateAddress(payload);
                case 'branding':
                    return clinicProfileService.updateBranding(payload);
                case 'invoice_settings':
                    return clinicProfileService.updateInvoiceSettings(payload);
                case 'notifications':
                    return clinicProfileService.updateNotificationTemplates(payload);
                case 'social_media':
                    return clinicProfileService.updateSocialMedia(payload);
                case 'additional':
                    return clinicProfileService.updateAdditionalSettings(payload);
                default:
                    throw new Error('Invalid section');
            }
        },
        onSuccess: (_, { section }) => {
            queryClient.invalidateQueries({ queryKey: ['clinicProfile', clinicId] });
            toast.success('Settings updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update settings');
        }
    });

    const updateProfile = async (section: keyof ClinicProfile, data: any) => {
        await updateProfileMutation.mutateAsync({ section, data });
    };

    const value = {
        clinicId,
        profile: profile || null,
        isLoading,
        error,
        updateProfile,
        refetchProfile: refetch
    };

    return (
        <ClinicContext.Provider value={value}>
            {children}
        </ClinicContext.Provider>
    );
};
