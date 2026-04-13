import React, { useState } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { useMedicines } from '../../hooks/useMedicines';
import CreateCustomMedicineModal from './CreateCustomMedicineModal';
import EditTemplateMedicineModal from './EditTemplateMedicineModal';

const MedicinesTab: React.FC = () => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [filter, setFilter] = useState<'all' | 'template' | 'custom'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomMedicine, setEditingCustomMedicine] = useState<any | null>(null);
    const [editingTemplateMedicine, setEditingTemplateMedicine] = useState<any | null>(null);

    const { medicines, categories, conditions, deleteMedicine, isDeleting, isLoading } = useMedicines(search, category);

    const filteredMedicines = medicines.filter(med => {
        if (filter === 'template') return !med.is_custom;
        if (filter === 'custom') return !!med.is_custom;
        return true;
    });

    const handleCreate = () => {
        setEditingCustomMedicine(null);
        setIsModalOpen(true);
    };

    const handleEdit = (medicine: any) => {
        if (medicine.is_custom) {
            setEditingCustomMedicine(medicine);
            setIsModalOpen(true);
        } else {
            setEditingTemplateMedicine(medicine);
        }
    };

    const handleDelete = async (medicineName: string) => {
        if (window.confirm('Are you sure you want to delete this custom medicine?')) {
            await deleteMedicine(medicineName);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <h2 className="text-xl font-bold text-gray-800">Medicines Management</h2>
                <Button onClick={handleCreate}>+ Add New Medicine</Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <input
                    type="text"
                    placeholder="Search medicines..."
                    className="rounded-md border px-3 py-2"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="rounded-md border px-3 py-2"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex rounded-md bg-gray-100 p-1">
                    {['all', 'template', 'custom'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as 'all' | 'template' | 'custom')}
                            className={`rounded-sm px-3 py-1 text-sm capitalize ${filter === f ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
                    <p className="mt-2 text-gray-600">Loading medicines...</p>
                </div>
            ) : filteredMedicines.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
                    <p className="text-gray-500">No medicines found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMedicines.map((med) => (
                        <Card key={`${med.template_name || med.name}-${med.medicine_name}`} className={`relative transition-all ${!med.is_active ? 'opacity-60' : ''}`}>
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-gray-900">{med.medicine_name}</h3>
                                            {!med.is_active && (
                                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Inactive</span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {med.dosage_form} {med.strength ? `· ${med.strength}` : ''} · {med.category}
                                        </p>
                                        {med.generic_name && (
                                            <p className="mt-0.5 text-xs text-gray-500">{med.generic_name}</p>
                                        )}
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${med.is_custom ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {med.is_custom ? 'Custom' : 'Template'}
                                    </span>
                                </div>

                                <div className="rounded border border-gray-100 bg-gray-50 px-2 py-2 text-xs text-gray-600">
                                    {med.default_morning}-{med.default_lunch}-{med.default_night} · {med.default_days} day(s)
                                    {med.default_condition ? ` · ${med.default_condition}` : ''}
                                </div>

                                <div className="flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                                    <button
                                        onClick={() => handleEdit(med)}
                                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                        title={med.is_custom ? 'Edit Medicine' : 'Edit Template Override'}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    {med.is_custom && (
                                        <button
                                            onClick={() => handleDelete(med.medicine_name)}
                                            disabled={isDeleting}
                                            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                            title="Delete"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <CreateCustomMedicineModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    categories={categories}
                    conditions={conditions}
                    initialData={editingCustomMedicine}
                />
            )}

            {editingTemplateMedicine && (
                <EditTemplateMedicineModal
                    isOpen={!!editingTemplateMedicine}
                    onClose={() => setEditingTemplateMedicine(null)}
                    categories={categories}
                    conditions={conditions}
                    medicine={editingTemplateMedicine}
                />
            )}
        </div>
    );
};

export default MedicinesTab;
