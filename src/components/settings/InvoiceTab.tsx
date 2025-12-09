import React from 'react';
import { useForm } from 'react-hook-form';
import { useClinicProfile } from '../../hooks/useClinicProfile';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Card from '../common/Card';

import { generateInvoiceHTML } from '../../utils/invoiceTemplates';

const InvoiceTab: React.FC = () => {
    const { profile, updateProfile, uploadDocument, isUploadingDocument } = useClinicProfile();

    const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<any>({
        defaultValues: profile?.invoice_settings || {}
    });

    const watchedTemplate = watch('template_id');

    const handlePreview = () => {
        const sampleInvoice = {
            invoice_id: 'PREVIEW-123',
            patient_name: 'John Doe',
            patient_id: 'P-001',
            posting_date: new Date().toISOString(),
            due_date: new Date().toISOString(),
            status: 'Unpaid',
            grand_total: 1500,
            outstanding_amount: 1500,
            items: [
                { item_name: 'Consultation', description: 'General Dental Checkup', qty: 1, rate: 500, amount: 500 },
                { item_name: 'Root Canal Treatment', description: 'Single sitting root canal', qty: 1, rate: 1000, amount: 1000 }
            ],
            discount_amount: 0,
            total_taxes_and_charges: 0,
            remarks: 'This is a sample invoice preview.'
        };

        // Construct a temporary profile object with current form values relative to the existing profile
        const currentSettings = watch();
        const previewProfile = {
            ...profile,
            invoice_settings: {
                ...profile?.invoice_settings,
                ...currentSettings
            }
        };

        const html = generateInvoiceHTML(sampleInvoice, previewProfile as any, watchedTemplate || 'standard');

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        } else {
            alert('Please allow pop-ups to view the preview');
        }
    };

    const onSubmit = async (data: any) => {
        await updateProfile('invoice_settings', data);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'seal') => {
        if (e.target.files && e.target.files[0]) {
            await uploadDocument({ type, file: e.target.files[0] });
        }
    };

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <Card title="📄 Invoice Settings">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex justify-end mb-4">
                        <Button type="button" variant="outline" onClick={handlePreview}>
                            👁️ Preview Template
                        </Button>
                    </div>

                    <InputField
                        label="Invoice Header Text"
                        {...register('header_text')}
                        placeholder="e.g. Tax Invoice / Receipt"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                        <textarea
                            {...register('footer_text')}
                            rows={3}
                            className="w-full border rounded-md p-2"
                            placeholder="e.g. Thank you for your business!"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                        <textarea
                            {...register('terms_conditions')}
                            rows={4}
                            className="w-full border rounded-md p-2"
                            placeholder="e.g. Payment due in 30 days."
                        />
                    </div>

                    <div className="flex gap-6 pt-4 border-t border-gray-100">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Signature</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 min-h-[150px]">
                                {profile.invoice_settings?.signature_url ? (
                                    <img src={profile.invoice_settings.signature_url} alt="Signature" className="max-h-24 mb-2" />
                                ) : (
                                    <span className="text-gray-400 mb-2">No signature uploaded</span>
                                )}
                                <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                                    {isUploadingDocument ? 'Uploading...' : 'Upload Signature'}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'signature')} disabled={isUploadingDocument} />
                                </label>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">Appears on bottom right</div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Seal</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 min-h-[150px]">
                                {profile.invoice_settings?.seal_url ? (
                                    <img src={profile.invoice_settings.seal_url} alt="Seal" className="max-h-24 mb-2" />
                                ) : (
                                    <span className="text-gray-400 mb-2">No seal uploaded</span>
                                )}
                                <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                                    {isUploadingDocument ? 'Uploading...' : 'Upload Seal'}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'seal')} disabled={isUploadingDocument} />
                                </label>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">Appears over signature</div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="show_logo" {...register('show_logo')} />
                            <label htmlFor="show_logo">Show clinic logo on invoice</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="show_seal" {...register('show_seal')} />
                            <label htmlFor="show_seal">Show clinic seal on invoice</label>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Invoice Template</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['standard', 'modern', 'minimal'].map((templateId) => (
                                <label
                                    key={templateId}
                                    className={`
                                        cursor-pointer border-2 rounded-lg p-4 transition-all hover:bg-gray-50
                                        ${watchedTemplate === templateId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                                    `}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="radio"
                                            value={templateId}
                                            {...register('template_id')}
                                            className="text-blue-600"
                                        />
                                        <span className="font-semibold capitalize text-gray-900">{templateId}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {templateId === 'standard' && 'Classic professional look with blue accents.'}
                                        {templateId === 'modern' && 'Clean, contemporary design with whitespace.'}
                                        {templateId === 'minimal' && 'Ink-saving, print-friendly black & white.'}
                                    </p>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={isSubmitting}>Save Invoice Settings</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default InvoiceTab;
