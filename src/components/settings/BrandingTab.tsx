import React from 'react';
import { useForm } from 'react-hook-form';
import { useClinicProfile } from '../../hooks/useClinicProfile';
import Button from '../common/Button';
import Card from '../common/Card';

const BrandingTab: React.FC = () => {
    const { profile, updateProfile } = useClinicProfile();

    const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
        defaultValues: profile?.branding || {
            primary_color: '#2563EB',
            secondary_color: '#10B981',
            text_color: '#1F2937',
            background_color: '#F9FAFB',
            font_family: 'Inter'
        }
    });

    const branding = watch();

    const onSubmit = async (data: any) => {
        await updateProfile('branding', data);
    };

    const handleReset = () => {
        reset({
            primary_color: '#2563EB',
            secondary_color: '#10B981',
            text_color: '#1F2937',
            background_color: '#F9FAFB',
            font_family: 'Inter'
        });
    };

    const fonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Arial', 'Helvetica'];

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-6">
                <Card title="🎨 Branding & Theme">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                                <div className="flex gap-2 items-center">
                                    <input type="color" {...register('primary_color')} className="w-10 h-10 border rounded p-1" />
                                    <input type="text" {...register('primary_color')} className="border rounded px-2 py-1 uppercase" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                                <div className="flex gap-2 items-center">
                                    <input type="color" {...register('secondary_color')} className="w-10 h-10 border rounded p-1" />
                                    <input type="text" {...register('secondary_color')} className="border rounded px-2 py-1 uppercase" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                                <div className="flex gap-2 items-center">
                                    <input type="color" {...register('text_color')} className="w-10 h-10 border rounded p-1" />
                                    <input type="text" {...register('text_color')} className="border rounded px-2 py-1 uppercase" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                                <div className="flex gap-2 items-center">
                                    <input type="color" {...register('background_color')} className="w-10 h-10 border rounded p-1" />
                                    <input type="text" {...register('background_color')} className="border rounded px-2 py-1 uppercase" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                                <select {...register('font_family')} className="w-full border rounded p-2">
                                    {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="outline" onClick={handleReset}>Reset to Defaults</Button>
                            <Button type="submit" isLoading={isSubmitting}>Save Branding</Button>
                        </div>
                    </form>
                </Card>
            </div>

            <div className="w-full lg:w-96">
                <Card title="Live Preview">
                    <div
                        style={{
                            backgroundColor: branding.background_color,
                            color: branding.text_color,
                            fontFamily: branding.font_family,
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}
                    >
                        <h3 className="text-xl font-bold mb-2">Sample Heading</h3>
                        <p className="mb-4 text-sm opacity-90">This is how your content will look with the selected colors and font.</p>

                        <button
                            style={{
                                backgroundColor: branding.primary_color,
                                color: '#ffffff',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                marginRight: '8px',
                                border: 'none'
                            }}
                        >
                            Primary Button
                        </button>

                        <button
                            style={{
                                backgroundColor: 'transparent',
                                border: `1px solid ${branding.primary_color}`,
                                color: branding.primary_color,
                                padding: '8px 16px',
                                borderRadius: '4px'
                            }}
                        >
                            Outline Button
                        </button>

                        <div className="mt-4 p-3 rounded bg-white border border-gray-100 shadow-sm" style={{ borderLeft: `4px solid ${branding.secondary_color}` }}>
                            <span className="text-xs font-bold" style={{ color: branding.secondary_color }}>Success/Secondary</span>
                            <p className="text-xs mt-1">Status indicators or accents will use this color.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default BrandingTab;
