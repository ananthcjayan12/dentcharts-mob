import React, { useState, useEffect } from 'react';
import Portal from '../common/Portal';
import Button from '../common/Button';
import { useProcedures } from '../../hooks/useProcedures';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface InvoiceItem {
    id: string;
    description: string;
    item_code: string;
    qty: number;
    rate: number;
}

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: any;
    completedProcedures?: any[];
    onSubmit: (data: any) => void;
    isCreating: boolean;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
    isOpen,
    onClose,
    appointment,
    completedProcedures = [],
    onSubmit,
    isCreating
}) => {
    const { procedures } = useProcedures();

    const [invoiceData, setInvoiceData] = useState({
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        discount: 0,
        tax: 0
    });

    const [items, setItems] = useState<InvoiceItem[]>([{
        id: Date.now().toString(),
        description: '',
        item_code: '',
        qty: 1,
        rate: 0
    }]);

    const addItem = () => {
        setItems([...items, {
            id: Date.now().toString(),
            description: '',
            item_code: '',
            qty: 1,
            rate: 0
        }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleDescriptionChange = (id: string, value: string) => {
        const selectedProcedure = procedures.find(p => p.procedure_name === value);

        setItems(items.map(item => {
            if (item.id === id) {
                if (selectedProcedure) {
                    return {
                        ...item,
                        description: value,
                        item_code: selectedProcedure.code || '',
                        rate: selectedProcedure.cost || 0
                    };
                }
                return { ...item, description: value };
            }
            return item;
        }));
    };

    const loadCompletedProcedures = () => {
        if (completedProcedures.length === 0) {
            alert('No completed procedures found for this appointment');
            return;
        }

        const procedureItems = completedProcedures.map(proc => ({
            id: Date.now().toString() + Math.random(),
            description: proc.procedure_name || proc.name,
            item_code: proc.code || '',
            qty: 1,
            rate: proc.cost || 0
        }));

        setItems(procedureItems);
    };

    const subtotal = items.reduce((sum, item) => sum + (item.qty * parseFloat(item.rate.toString() || '0')), 0);
    const discountAmount = (subtotal * invoiceData.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * invoiceData.tax) / 100;
    const total = taxableAmount + taxAmount;

    const handleSubmit = () => {
        onSubmit({
            ...invoiceData,
            items,
            subtotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total
        });
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
                        <div>
                            <h2 className="text-2xl font-bold">Create Invoice</h2>
                            <p className="text-blue-100 text-sm mt-0.5">
                                {appointment?.patient_name || appointment?.patient}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Date Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Date</label>
                                <input
                                    type="date"
                                    value={invoiceData.date}
                                    onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                                <input
                                    type="date"
                                    value={invoiceData.dueDate}
                                    onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Load Procedures Button */}
                        {completedProcedures.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-blue-900">Quick Add</p>
                                        <p className="text-sm text-blue-700">{completedProcedures.length} completed procedure(s) available</p>
                                    </div>
                                    <Button onClick={loadCompletedProcedures} variant="secondary">
                                        Load All Procedures
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Items Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold text-gray-900">Invoice Items</h3>
                                <Button onClick={addItem} size="sm">+ Add Item</Button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-sm font-semibold text-gray-600">Item {index + 1}</span>
                                            {items.length > 1 && (
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                            <div className="md:col-span-6">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Procedure / Description</label>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                                                    placeholder="Enter procedure name or custom text"
                                                    list={`procedures-${item.id}`}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <datalist id={`procedures-${item.id}`}>
                                                    {procedures.map(proc => (
                                                        <option key={proc.procedure_name} value={proc.procedure_name}>
                                                            {proc.code} - ₹{proc.cost}
                                                        </option>
                                                    ))}
                                                </datalist>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                                                <input
                                                    type="text"
                                                    value={item.item_code}
                                                    onChange={(e) => updateItem(item.id, 'item_code', e.target.value)}
                                                    placeholder="Code"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Rate (₹)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.rate}
                                                    onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        {/* Item Total */}
                                        <div className="mt-2 text-right">
                                            <span className="text-sm text-gray-600">Item Total: </span>
                                            <span className="text-lg font-bold text-gray-900">₹{(item.qty * parseFloat(item.rate.toString())).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Discount & Tax */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={invoiceData.discount}
                                    onChange={(e) => setInvoiceData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tax (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={invoiceData.tax}
                                    onChange={(e) => setInvoiceData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes / Terms</label>
                            <textarea
                                value={invoiceData.notes}
                                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                                placeholder="Payment terms, special instructions, etc."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Invoice Summary */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Invoice Summary</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {invoiceData.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Discount ({invoiceData.discount}%)</span>
                                        <span className="font-semibold text-green-600">-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {invoiceData.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax ({invoiceData.tax}%)</span>
                                        <span className="font-semibold text-gray-900">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="h-px bg-gray-300 my-2"></div>
                                <div className="flex justify-between">
                                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-bold text-blue-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                        <Button onClick={onClose} variant="secondary">Cancel</Button>
                        <Button onClick={handleSubmit} isLoading={isCreating}>
                            Create Invoice
                        </Button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default CreateInvoiceModal;
