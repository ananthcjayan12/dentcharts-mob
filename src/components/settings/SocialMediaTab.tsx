import React from 'react';
import { useForm } from 'react-hook-form';
import { useClinicProfile } from '../../hooks/useClinicProfile';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Card from '../common/Card';

const SocialMediaTab: React.FC = () => {
    const { profile, updateProfile } = useClinicProfile();

    const { register, handleSubmit, formState: { isSubmitting } } = useForm({
        defaultValues: profile?.social_media || {}
    });

    const onSubmit = async (data: any) => {
        await updateProfile('social_media', data);
    };

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <Card title="🔗 Social Media Links">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <InputField
                        label="Facebook Page"
                        {...register('facebook')}
                        placeholder="https://facebook.com/..."
                    />
                    <InputField
                        label="Instagram Profile"
                        {...register('instagram')}
                        placeholder="https://instagram.com/..."
                    />
                    <InputField
                        label="Twitter / X"
                        {...register('twitter')}
                        placeholder="https://twitter.com/..."
                    />
                    <InputField
                        label="Google Maps Location"
                        {...register('google_maps')}
                        placeholder="https://maps.google.com/..."
                    />

                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={isSubmitting}>Save Links</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SocialMediaTab;
