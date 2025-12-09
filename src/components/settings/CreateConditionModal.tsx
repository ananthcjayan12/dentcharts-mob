import React from 'react';
import { useForm } from 'react-hook-form';
import { useConditions } from '../../hooks/useConditions';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Portal from '../common/Portal';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateConditionModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    types: string[];
}

const CreateConditionModal: React.FC<CreateConditionModalProps> = ({ isOpen, onClose, categories, types }) => {
    const { createCondition, isCreating } = useConditions();

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data: any) => {
        await createCondition({
            condition_name: data.condition_name,
            code: data.code,
            type: data.type,
            category: data.category,
            color: data.color,
            icon: data.icon,
            description: data.description,
            treatment_required: data.treatment_required ? 1 : 0
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Create New Condition</h3>
                        <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <InputField
                            label="Condition Name"
                            {...register('condition_name', { required: 'Name is required' })}
                            error={errors.condition_name?.message as string}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Code"
                                {...register('code')}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select {...register('type')} className="w-full border rounded-md p-2">
                                    <option value="">Select Type</option>
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select {...register('category')} className="w-full border rounded-md p-2">
                                    <option value="Other">Other</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <InputField
                                label="Color (Hex)"
                                type="color"
                                {...register('color')}
                                className="h-10 p-1"
                            />
                        </div>

                        <InputField
                            label="Icon (Emoji)"
                            {...register('icon')}
                            placeholder="🦷"
                        />

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="treatment_required" {...register('treatment_required')} />
                            <label htmlFor="treatment_required">Treatment Required</label>
                        </div>

                        <InputField
                            label="Description"
                            {...register('description')}
                        />

                        <div className="flex justify-end pt-4">
                            <Button type="submit" isLoading={isCreating}>Create Condition</Button>
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
};

export default CreateConditionModal;
