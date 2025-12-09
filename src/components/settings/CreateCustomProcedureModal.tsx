import React from 'react';
import { useForm } from 'react-hook-form';
import { useProcedures } from '../../hooks/useProcedures';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Portal from '../common/Portal';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateCustomProcedureModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    initialData?: {
        procedure_name: string;
        cost: number;
        code?: string;
        category?: string;
        description?: string;
        duration_minutes?: number;
    } | null;
}

const CreateCustomProcedureModal: React.FC<CreateCustomProcedureModalProps> = ({ isOpen, onClose, categories, initialData }) => {
    const { createProcedure, isCreating, updateProcedure, isUpdating } = useProcedures();

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            category: 'Other',
            duration_minutes: 30
        }
    });

    const isEditMode = !!initialData;
    const isLoading = isCreating || isUpdating;

    const onSubmit = async (data: any) => {
        if (isEditMode) {
            await updateProcedure({
                procedure_name: data.procedure_name,
                cost: Number(data.cost),
                code: data.code,
                category: data.category,
                description: data.description,
                duration_minutes: Number(data.duration_minutes) || 30,
                original_name: initialData?.procedure_name
            });
        } else {
            await createProcedure({
                procedure_name: data.procedure_name,
                cost: Number(data.cost),
                code: data.code,
                category: data.category,
                description: data.description,
                duration_minutes: Number(data.duration_minutes) || 30
            });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">{isEditMode ? 'Edit Procedure' : 'Create New Procedure'}</h3>
                        <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <InputField
                            label="Procedure Name *"
                            {...register('procedure_name', { required: 'Name is required' })}
                            error={errors.procedure_name?.message as string}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Code"
                                {...register('code')}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select {...register('category', { required: true })} className="w-full border rounded-md p-2">
                                    <option value="">Select Category</option>
                                    <option value="General">General</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Cost (₹) *"
                                type="number"
                                {...register('cost', { required: 'Cost is required', min: 0 })}
                                error={errors.cost?.message as string}
                            />
                            <InputField
                                label="Duration (mins)"
                                type="number"
                                {...register('duration_minutes', { min: 1 })}
                                defaultValue="30"
                            />
                        </div>

                        <InputField
                            label="Description"
                            {...register('description')}
                        />

                        <div className="flex justify-end pt-4">
                            <Button type="submit" isLoading={isLoading}>{isEditMode ? 'Update Procedure' : 'Create Procedure'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
};

export default CreateCustomProcedureModal;
