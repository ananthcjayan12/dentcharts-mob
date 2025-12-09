import React, { useState } from 'react';
import { useConditions } from '../../hooks/useConditions';
import Button from '../common/Button';
import Card from '../common/Card';
import CreateConditionModal from './CreateConditionModal';
import EditTemplateConditionModal from './EditTemplateConditionModal';

const ConditionsTab: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'template' | 'custom'>('all');
    const [category, setCategory] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

    const { conditions, categories, types, deleteCondition, isDeleting } = useConditions(search, category);

    const filteredConditions = conditions.filter(c => {
        if (filter === 'template') return !c.is_custom;
        if (filter === 'custom') return c.is_custom;
        return true;
    });

    const handleEdit = (cond: any) => {
        if (cond.is_custom) {
            // TODO: Add EditCustomConditionModal for full editing
            console.log('Edit custom condition:', cond);
        } else {
            // Edit template - toggle active status
            setEditingTemplate(cond);
        }
    };

    const handleDelete = async (conditionName: string) => {
        if (window.confirm('Are you sure you want to delete this condition?')) {
            await deleteCondition(conditionName);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Conditions Management</h2>
                <Button onClick={() => setIsModalOpen(true)}>+ Add New Condition</Button>
            </div>

            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <input
                    type="text"
                    placeholder="Search conditions..."
                    className="px-3 py-2 border rounded-md"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="px-3 py-2 border rounded-md"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex bg-gray-100 rounded-md p-1">
                    {['all', 'template', 'custom'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 rounded-sm text-sm capitalize ${filter === f ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConditions.map((cond) => (
                    <Card key={cond.condition_name} className={`relative transition-all ${!cond.is_active ? 'opacity-60' : ''}`}>
                        <div className="space-y-3">
                            {/* Header with icon */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3 flex-1">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                                        style={{ backgroundColor: `${cond.color || '#E5E7EB'}33`, color: cond.color || '#6B7280' }}
                                    >
                                        {cond.icon || '🦷'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 text-sm">{cond.condition_name}</h3>
                                            {!cond.is_active && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{cond.category} · {cond.type}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${cond.is_custom ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {cond.is_custom ? 'Custom' : 'Template'}
                                </span>
                            </div>

                            {/* Severity levels */}
                            {cond.severity_levels && cond.severity_levels.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {cond.severity_levels.map((level: any) => (
                                        <span key={level} className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-600 rounded border border-gray-200">
                                            {level}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Footer with actions */}
                            <div className="flex justify-end items-center pt-3 border-t border-gray-100 gap-1">
                                <button
                                    onClick={() => handleEdit(cond)}
                                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                    title={cond.is_custom ? "Edit Condition" : "Edit Status"}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>

                                {cond.is_custom && (
                                    <button
                                        onClick={() => handleDelete(cond.condition_name)}
                                        disabled={isDeleting}
                                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {isModalOpen && (
                <CreateConditionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    categories={categories}
                    types={types}
                />
            )}

            {editingTemplate && (
                <EditTemplateConditionModal
                    isOpen={!!editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                    condition={editingTemplate}
                    categories={categories}
                    types={types}
                />
            )}
        </div>
    );
};

export default ConditionsTab;
