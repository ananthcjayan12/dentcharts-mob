import React from 'react';
import { useForm } from 'react-hook-form';
import { useClinicProfile } from '../../hooks/useClinicProfile';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Card from '../common/Card';

const NotificationsTab: React.FC = () => {
    const { profile, updateProfile } = useClinicProfile();

    const { register, handleSubmit, formState: { isSubmitting } } = useForm({
        defaultValues: profile?.notifications || {}
    });

    const onSubmit = async (data: any) => {
        await updateProfile('notifications', data);
    };

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <Card title="🔔 Notification Templates">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mb-4">
                        <strong>Note:</strong> You can use placeholders like {'{patient_name}'}, {'{date}'}, {'{time}'}, {'{amount}'}, etc. to insert dynamic values.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMS Sender Name</label>
                        <InputField
                            {...register('sms_sender', { maxLength: 6 })}
                            placeholder="PROCLIN"
                            className="max-w-[150px]"
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 6 significant characters.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Reminder</label>
                        <textarea
                            {...register('appointment_reminder')}
                            rows={3}
                            className="w-full border rounded-md p-2"
                            placeholder="Hi {patient_name}, your appointment is on {date} at {time}."
                        />
                        <div className="flex gap-2 mt-1 text-xs text-gray-500">
                            <span className="bg-gray-100 px-1 rounded">{'{patient_name}'}</span>
                            <span className="bg-gray-100 px-1 rounded">{'{date}'}</span>
                            <span className="bg-gray-100 px-1 rounded">{'{time}'}</span>
                            <span className="bg-gray-100 px-1 rounded">{'{doctor}'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Receipt</label>
                        <textarea
                            {...register('payment_receipt')}
                            rows={3}
                            className="w-full border rounded-md p-2"
                            placeholder="Received {amount} for {services}. Invoice #{invoice_number}."
                        />
                        <div className="flex gap-2 mt-1 text-xs text-gray-500">
                            <span className="bg-gray-100 px-1 rounded">{'{amount}'}</span>
                            <span className="bg-gray-100 px-1 rounded">{'{invoice_number}'}</span>
                            <span className="bg-gray-100 px-1 rounded">{'{payment_mode}'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prescription Message</label>
                        <textarea
                            {...register('prescription_message')}
                            rows={3}
                            className="w-full border rounded-md p-2"
                            placeholder="Here is your prescription link: {link}. Get well soon!"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={isSubmitting}>Save Templates</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default NotificationsTab;
