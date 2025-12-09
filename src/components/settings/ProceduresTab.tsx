import React, { useState } from 'react';
import { useProcedures } from '../../hooks/useProcedures';
import Button from '../common/Button';
import Card from '../common/Card';
import CreateCustomProcedureModal from './CreateCustomProcedureModal';
import EditTemplatePricingModal from './EditTemplatePricingModal';
// import { Procedure } from '../../api/services/procedures';

const ProceduresTab: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'template' | 'custom'>('all');
    const [category, setCategory] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProcedure, setEditingProcedure] = useState<any | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

    // Debounced search could be implemented here, passing directly for now
    const { procedures, categories, overrideProcedure, deleteProcedure, isOverriding, isDeleting, isLoading } = useProcedures(search, category);

    const handleCreate = () => {
        setEditingProcedure(null);
        setIsModalOpen(true);
    };

    const handleEdit = (proc: any) => {
        console.log('Edit clicked for procedure:', proc);
        if (proc.is_custom) {
            // Edit custom procedure - full edit
            setEditingProcedure(proc);
            setIsModalOpen(true);
        } else {
            // Edit template procedure - pricing only
            setEditingTemplate(proc);
        }
    };

    const filteredProcedures = procedures.filter(p => {
        if (filter === 'template') return !p.is_custom;
        if (filter === 'custom') return p.is_custom;
        return true;
    });

    console.log('Procedures:', procedures);
    console.log('Filtered Procedures:', filteredProcedures);

    const handleDelete = async (procedureName: string) => {
        if (window.confirm('Are you sure you want to delete this procedure?')) {
            await deleteProcedure(procedureName);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Procedures Management</h2>
                <Button onClick={handleCreate}>+ Add New Procedure</Button>
            </div>

            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <input
                    type="text"
                    placeholder="Search procedures..."
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

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="mt-2 text-gray-600">Loading procedures...</p>
                </div>
            ) : filteredProcedures.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">No procedures found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProcedures.map((proc) => (
                        <Card key={proc.procedure_name} className={`relative transition-all ${!proc.is_active ? 'opacity-60' : ''}`}>
                            <div className="space-y-3">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 text-sm">{proc.procedure_name}</h3>
                                            {!proc.is_active && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        {proc.code && (
                                            <p className="text-xs text-gray-500 mt-0.5">Code: {proc.code}</p>
                                        )}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${proc.is_custom ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {proc.is_custom ? 'Custom' : 'Template'}
                                    </span>
                                </div>

                                {/* Details */}
                                {proc.category && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <span className="px-2 py-0.5 bg-gray-50 rounded border border-gray-200">
                                            {proc.category}
                                        </span>
                                        {proc.duration_minutes && (
                                            <span className="px-2 py-0.5 bg-gray-50 rounded border border-gray-200">
                                                {proc.duration_minutes} min
                                            </span>
                                        )}
                                    </div>
                                )}

                                {proc.description && (
                                    <p className="text-xs text-gray-600 line-clamp-2">{proc.description}</p>
                                )}

                                {/* Footer */}
                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span className="font-bold text-gray-900 text-lg">₹{proc.cost.toLocaleString()}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(proc)}
                                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                            title={proc.is_custom ? "Edit Procedure" : "Edit Pricing"}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>

                                        {proc.is_custom && (
                                            <button
                                                onClick={() => handleDelete(proc.procedure_name)}
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
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <CreateCustomProcedureModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    categories={categories}
                    initialData={editingProcedure}
                />
            )}

            {editingTemplate && (
                <EditTemplatePricingModal
                    isOpen={!!editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                    procedure={editingTemplate}
                    categories={categories}
                />
            )}
        </div>
    );
};

export default ProceduresTab;
