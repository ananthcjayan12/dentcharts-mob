import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useClinicProfile } from '../../hooks/useClinicProfile';
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

    const { register: registerAddress, handleSubmit: handleSubmitAddress, formState: { isSubmitting: isAddressSubmitting }, reset: resetAddress } = useForm({
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

    if (!profile) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Header / Intro */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Clinic Profile</h1>
                <p className="text-gray-500 mt-1">Manage your clinic's public information and settings.</p>
            </div>

            {/* Basic Information Section */}
            <Card className="overflow-visible">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Logo Section */}
                    <div className="w-full md:w-auto flex flex-col items-center space-y-4 pt-2">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg ring-1 ring-gray-100 transition-all group-hover:ring-blue-200">
                                {profile.basic_info.logo_url ? (
                                    <img src={profile.basic_info.logo_url} alt="Clinic Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                )}
                                {isUploadingLogo && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer shadow-md hover:bg-blue-700 transition-colors transform hover:scale-105 active:scale-95">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                            </label>
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-medium text-gray-900">Clinic Logo</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Recommended 500x500px</p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Basic Details</h3>
                                <p className="text-sm text-gray-500">Identity and contact information</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitBasic(onBasicSubmit)} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <InputField
                                        label="Clinic Name"
                                        placeholder="e.g. City Dental Care"
                                        {...registerBasic('clinic_name', { required: 'Clinic name is required' })}
                                        error={basicErrors.clinic_name?.message as string}
                                    />
                                </div>
                                <InputField
                                    label="Abbreviation"
                                    placeholder="e.g. CDC"
                                    {...registerBasic('abbr')}
                                />
                                <InputField
                                    label="Registration Number"
                                    placeholder="Reg. No."
                                    {...registerBasic('registration_number')}
                                />
                                <InputField
                                    label="Phone Number"
                                    placeholder="+91 98765 43210"
                                    {...registerBasic('phone')}
                                />
                                <InputField
                                    label="Email Address"
                                    type="email"
                                    placeholder="contact@example.com"
                                    {...registerBasic('email')}
                                />
                                <InputField
                                    label="Website"
                                    placeholder="https://example.com"
                                    {...registerBasic('website')}
                                />
                                <InputField
                                    label="Tax ID / GSTIN"
                                    placeholder="Tax Identification"
                                    {...registerBasic('tax_id')}
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit" isLoading={isBasicSubmitting}>Save Basic Details</Button>
                            </div>
                        </form>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Appointment Settings */}
                <Card>
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Scheduling</h3>
                            <p className="text-sm text-gray-500">Configure appointment slots</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitAdditional(onAdditionalSubmit)} className="space-y-5">
                        <div className="space-y-4">
                            <InputField
                                label="Slot Duration (Minutes)"
                                type="number"
                                {...registerAdditional('appointment_slot_duration')}
                                placeholder="30"
                                error={additionalErrors.appointment_slot_duration?.message as string}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="Opening Time"
                                    type="time"
                                    {...registerAdditional('start_time')}
                                    placeholder="09:00"
                                    error={additionalErrors.start_time?.message as string}
                                />
                                <InputField
                                    label="Closing Time"
                                    type="time"
                                    {...registerAdditional('end_time')}
                                    placeholder="17:00"
                                    error={additionalErrors.end_time?.message as string}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" isLoading={isAdditionalSubmitting}>Update Schedule</Button>
                        </div>
                    </form>
                </Card>

                {/* Address Section */}
                <Card>
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Location</h3>
                            <p className="text-sm text-gray-500">Clinic address and location</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitAddress(onAddressSubmit)} className="space-y-5">
                        <div className="space-y-4">
                            <InputField
                                label="Address Line 1"
                                placeholder="Street address, building, etc."
                                {...registerAddress('address_line1')}
                            />
                            <InputField
                                label="Address Line 2"
                                placeholder="Apartment, suite, unit (optional)"
                                {...registerAddress('address_line2')}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="City"
                                    placeholder="City"
                                    {...registerAddress('city')}
                                />
                                <InputField
                                    label="State"
                                    placeholder="State"
                                    {...registerAddress('state')}
                                />
                                <InputField
                                    label="Country"
                                    placeholder="Country"
                                    {...registerAddress('country')}
                                />
                                <InputField
                                    label="Pincode"
                                    placeholder="ZIP Code"
                                    {...registerAddress('pincode')}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" isLoading={isAddressSubmitting}>Save Address</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ProfileTab;
