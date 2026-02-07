import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useClinicProfile } from '../../hooks/useClinicProfile';
import { ClinicProfile } from '../../api/services/clinicProfile';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Card from '../common/Card';

const ProfileTab: React.FC = () => {
    const { profile, updateProfile, uploadLogo, isUploadingLogo } = useClinicProfile();

    const formatTimeForInput = (value?: string) => {
        if (!value) return value;
        const parts = value.split(':');
        if (parts.length < 2) return value;
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const { register: registerBasic, handleSubmit: handleSubmitBasic, formState: { errors: basicErrors, isSubmitting: isBasicSubmitting }, reset: resetBasic } = useForm({
        defaultValues: profile?.basic_info || {}
    });

    const { register: registerAddress, handleSubmit: handleSubmitAddress, formState: { errors: addressErrors, isSubmitting: isAddressSubmitting }, reset: resetAddress } = useForm({
        defaultValues: profile?.address || {}
    });

    const { register: registerAdditional, handleSubmit: handleSubmitAdditional, formState: { errors: additionalErrors, isSubmitting: isAdditionalSubmitting }, reset: resetAdditional } = useForm({
        defaultValues: profile?.additional || {}
    });

    const onBasicSubmit = async (data: any) => {
        await updateProfile('basic_info', data);
    };

    const onAddressSubmit = async (data: any) => {
        await updateProfile('address', data);
    };

    const onAdditionalSubmit = async (data: any) => {
        await updateProfile('additional', data);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await uploadLogo(e.target.files[0]);
        }
    };

    useEffect(() => {
        if (profile?.basic_info) {
            resetBasic(profile.basic_info);
        }
        if (profile?.address) {
            resetAddress(profile.address);
        }
        if (profile?.additional) {
            resetAdditional({
                ...profile.additional,
                start_time: formatTimeForInput(profile.additional.start_time),
                end_time: formatTimeForInput(profile.additional.end_time)
            });
        }
    }, [profile, resetBasic, resetAddress, resetAdditional]);

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <Card title="🏥 Basic Information">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                            {profile.basic_info.logo_url ? (
                                <img src={profile.basic_info.logo_url} alt="Clinic Logo" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl">🏥</span>
                            )}
                        </div>
                        <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                            {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                        </label>
                    </div>

                    <form onSubmit={handleSubmitBasic(onBasicSubmit)} className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Clinic Name"
                                {...registerBasic('clinic_name', { required: 'Clinic name is required' })}
                                error={basicErrors.clinic_name?.message as string}
                            />
                            <InputField
                                label="Abbreviation"
                                {...registerBasic('abbr')}
                            />
                            <InputField
                                label="Phone"
                                {...registerBasic('phone')}
                            />
                            <InputField
                                label="Email"
                                type="email"
                                {...registerBasic('email')}
                            />
                            <InputField
                                label="Website"
                                {...registerBasic('website')}
                            />
                            <InputField
                                label="Registration Number"
                                {...registerBasic('registration_number')}
                            />
                            <InputField
                                label="Tax ID"
                                {...registerBasic('tax_id')}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" isLoading={isBasicSubmitting}>Save Changes</Button>
                        </div>
                    </form>
                </div>
            </Card>

            <Card title="⏰ Appointment Settings">
                <form onSubmit={handleSubmitAdditional(onAdditionalSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField
                            label="Slot Size (Minutes)"
                            type="number"
                            {...registerAdditional('appointment_slot_duration')}
                            placeholder="30"
                            error={additionalErrors.appointment_slot_duration?.message as string}
                        />
                        <InputField
                            label="Start Time"
                            type="time"
                            {...registerAdditional('start_time')}
                            placeholder="09:00"
                            error={additionalErrors.start_time?.message as string}
                        />
                        <InputField
                            label="End Time"
                            type="time"
                            {...registerAdditional('end_time')}
                            placeholder="17:00"
                            error={additionalErrors.end_time?.message as string}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" isLoading={isAdditionalSubmitting}>Save Appointment Settings</Button>
                    </div>
                </form>
            </Card>

            <Card title="📍 Address">
                <form onSubmit={handleSubmitAddress(onAddressSubmit)} className="space-y-4">
                    <InputField
                        label="Address Line 1"
                        {...registerAddress('address_line1')}
                    />
                    <InputField
                        label="Address Line 2"
                        {...registerAddress('address_line2')}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            label="City"
                            {...registerAddress('city')}
                        />
                        <InputField
                            label="State"
                            {...registerAddress('state')}
                        />
                        <InputField
                            label="Country"
                            {...registerAddress('country')}
                        />
                        <InputField
                            label="Pincode"
                            {...registerAddress('pincode')}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" isLoading={isAddressSubmitting}>Save Address</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ProfileTab;
