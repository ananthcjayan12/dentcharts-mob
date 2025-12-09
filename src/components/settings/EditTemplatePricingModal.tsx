import React from 'react';
import { useForm } from 'react-hook-form';
import { useProcedures } from '../../hooks/useProcedures';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Portal from '../common/Portal';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditTemplatePricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    procedure: {
        procedure_name: string;
        template_name: string;
        code: string;
        category: string;
        cost: number;
        duration_minutes: number;
        description: string;
        is_active: boolean;
    };
}

const EditTemplatePricingModal: React.FC<EditTemplatePricingModalProps> = ({ isOpen, onClose, categories, procedure }) => {
    const { overrideProcedure, isOverriding } = useProcedures();

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            procedure_name: procedure.procedure_name,
            code: procedure.code,
            category: procedure.category,
            cost: procedure.cost,
            duration_minutes: procedure.duration_minutes,
            description: procedure.description,
            is_active: procedure.is_active
        }
    });

    const onSubmit = async (data: any) => {
        await overrideProcedure({
            procedure_template: procedure.template_name,
            procedure_name: data.procedure_name,
            code: data.code,
            category: data.category,
            cost: Number(data.cost),
            duration_minutes: Number(data.duration_minutes),
            description: data.description,
            is_active: data.is_active ? 1 : 0
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold">Override Template Procedure</h3>
                            <p className="text-sm text-gray-500 mt-1">Customize this template for your clinic</p>
                        </div>
                        <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                    </div>

                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600">Template ID: {procedure.template_name}</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Procedure Name *"
                                {...register('procedure_name', { required: 'Procedure name is required' })}
                                error={errors.procedure_name?.message as string}
                            />
                            <InputField
                                label="Code"
                                {...register('code')}
                                error={errors.code?.message as string}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <InputField
                                label="Cost (₹) *"
                                type="number"
                                {...register('cost', { required: 'Cost is required', min: 0 })}
                                error={errors.cost?.message as string}
                            />
                        </div>

                        <InputField
                            label="Duration (minutes)"
                            type="number"
                            {...register('duration_minutes', { min: 0 })}
                            error={errors.duration_minutes?.message as string}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <input
                                type="checkbox"
                                id="is_active"
                                {...register('is_active')}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                Active (visible in treatment plans)
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button type="submit" isLoading={isOverriding}>Save Override</Button>
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
};

export default EditTemplatePricingModal;
