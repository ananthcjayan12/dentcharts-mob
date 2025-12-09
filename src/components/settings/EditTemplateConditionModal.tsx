import React from 'react';
import { useForm } from 'react-hook-form';
import { useConditions } from '../../hooks/useConditions';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Portal from '../common/Portal';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditTemplateConditionModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    types: string[];
    condition: {
        condition_name: string;
        template_name: string;
        code: string;
        type: string;
        category: string;
        description: string;
        icon: string;
        color: string;
        treatment_required: number;
        severity_levels: string[];
        is_active: boolean;
    };
}

const EditTemplateConditionModal: React.FC<EditTemplateConditionModalProps> = ({ isOpen, onClose, categories, types, condition }) => {
    const { overrideCondition, isOverriding } = useConditions();

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            condition_name: condition.condition_name,
            code: condition.code,
            type: condition.type,
            category: condition.category,
            description: condition.description,
            icon: condition.icon,
            color: condition.color,
            treatment_required: condition.treatment_required,
            is_active: condition.is_active
        }
    });

    const onSubmit = async (data: any) => {
        await overrideCondition({
            condition_template: condition.template_name,
            condition_name: data.condition_name,
            code: data.code,
            type: data.type,
            category: data.category,
            description: data.description,
            icon: data.icon,
            color: data.color,
            treatment_required: data.treatment_required ? 1 : 0,
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
                            <h3 className="text-xl font-bold">Override Template Condition</h3>
                            <p className="text-sm text-gray-500 mt-1">Customize this template for your clinic</p>
                        </div>
                        <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                    </div>

                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600">Template ID: {condition.template_name}</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Condition Name *"
                                {...register('condition_name', { required: 'Condition name is required' })}
                                error={errors.condition_name?.message as string}
                            />
                            <InputField
                                label="Code"
                                {...register('code')}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select {...register('type')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Icon (emoji)"
                                {...register('icon')}
                                placeholder="🦷"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                <input
                                    type="color"
                                    {...register('color')}
                                    className="w-full h-10 rounded-md border border-gray-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="treatment_required"
                                    {...register('treatment_required')}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="treatment_required" className="text-sm font-medium text-gray-700">
                                    Treatment Required
                                </label>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    {...register('is_active')}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                    Active (visible in dental charts)
                                </label>
                            </div>
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

export default EditTemplateConditionModal;
