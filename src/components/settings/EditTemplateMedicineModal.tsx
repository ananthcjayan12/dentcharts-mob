import React from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Portal from '../common/Portal';
import { useMedicines } from '../../hooks/useMedicines';

const DOSAGE_FORMS = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Drops',
    'Injection',
    'Cream',
    'Ointment',
    'Gel',
    'Powder',
    'Inhaler',
    'Suspension',
    'Mouthwash',
    'Other',
];

interface EditTemplateMedicineModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    conditions: string[];
    medicine: {
        template_name: string;
        medicine_name: string;
        generic_name?: string;
        dosage_form?: string;
        strength?: string;
        category?: string;
        default_morning?: number;
        default_lunch?: number;
        default_evening?: number;
        default_night?: number;
        default_days?: number;
        default_condition?: string;
        instructions?: string;
        description?: string;
        is_active?: boolean;
    };
}

const EditTemplateMedicineModal: React.FC<EditTemplateMedicineModalProps> = ({
    isOpen,
    onClose,
    categories,
    conditions,
    medicine,
}) => {
    const { overrideMedicine, isOverriding } = useMedicines();

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            medicine_name: medicine.medicine_name,
            generic_name: medicine.generic_name,
            dosage_form: medicine.dosage_form || 'Tablet',
            strength: medicine.strength,
            category: medicine.category || 'Other',
            default_morning: medicine.default_morning || 0,
            default_lunch: medicine.default_lunch || 0,
            default_evening: medicine.default_evening || 0,
            default_night: medicine.default_night || 0,
            default_days: medicine.default_days || 5,
            default_condition: medicine.default_condition || 'After Food',
            instructions: medicine.instructions,
            description: medicine.description,
            is_active: Boolean(medicine.is_active),
        },
    });

    const onSubmit = async (data: any) => {
        await overrideMedicine({
            medicine_template: medicine.template_name,
            medicine_name: data.medicine_name,
            generic_name: data.generic_name,
            dosage_form: data.dosage_form,
            strength: data.strength,
            category: data.category,
            default_morning: Number(data.default_morning || 0),
            default_lunch: Number(data.default_lunch || 0),
            default_evening: Number(data.default_evening || 0),
            default_night: Number(data.default_night || 0),
            default_days: Number(data.default_days || 0),
            default_condition: data.default_condition,
            instructions: data.instructions,
            description: data.description,
            is_active: data.is_active ? 1 : 0,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6" onClick={e => e.stopPropagation()}>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold">Override Template Medicine</h3>
                            <p className="mt-1 text-sm text-gray-500">Customize this template for your clinic</p>
                        </div>
                        <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
                    </div>

                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs text-blue-600">Template ID: {medicine.template_name}</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <InputField
                                label="Medicine Name *"
                                {...register('medicine_name', { required: 'Medicine name is required' })}
                                error={errors.medicine_name?.message as string}
                            />
                            <InputField label="Generic Name" {...register('generic_name')} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Dosage Form</label>
                                <select {...register('dosage_form')} className="w-full rounded-md border border-gray-300 px-3 py-2">
                                    {DOSAGE_FORMS.map(form => <option key={form} value={form}>{form}</option>)}
                                </select>
                            </div>
                            <InputField label="Strength" {...register('strength')} />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                                <select {...register('category')} className="w-full rounded-md border border-gray-300 px-3 py-2">
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                            <InputField label="Morning" type="number" min="0" {...register('default_morning')} />
                            <InputField label="Lunch" type="number" min="0" {...register('default_lunch')} />
                            <InputField label="Evening" type="number" min="0" {...register('default_evening')} />
                            <InputField label="Night" type="number" min="0" {...register('default_night')} />
                            <InputField label="Days" type="number" min="0" {...register('default_days')} />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Condition</label>
                            <select {...register('default_condition')} className="w-full rounded-md border border-gray-300 px-3 py-2">
                                {conditions.map(condition => <option key={condition} value={condition}>{condition}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Instructions</label>
                            <textarea {...register('instructions')} rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                            <textarea {...register('description')} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                        </div>

                        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                            <input type="checkbox" id="is_active" {...register('is_active')} className="h-4 w-4" />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button type="submit" isLoading={isOverriding}>Save Override</Button>
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
};

export default EditTemplateMedicineModal;
