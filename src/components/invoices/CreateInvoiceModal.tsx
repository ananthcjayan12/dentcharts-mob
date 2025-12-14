import React, { useState, useEffect } from 'react';
import Portal from '../common/Portal';
import Button from '../common/Button';
import InputField from '../common/InputField';
import { useProcedures } from '../../hooks/useProcedures';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface InvoiceItem {
    id: string;
    description: string;
    item_code: string;
    qty: number | string;
    rate: number | string;
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

    const [invoiceData, setInvoiceData] = useState<{
        date: string;
        dueDate: string;
        notes: string;
        discount: number | string;
        tax: number | string;
    }>({
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        discount: 0,
        tax: 0
    });

    // New State for Discount Type
    const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');

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

    // Calculate Totals safely handling strings
    const subtotal = items.reduce((sum, item) => {
        const qty = parseFloat(item.qty.toString()) || 0;
        const rate = parseFloat(item.rate.toString()) || 0;
        return sum + (qty * rate);
    }, 0);

    const discountValue = parseFloat(invoiceData.discount.toString()) || 0;
    const taxValue = parseFloat(invoiceData.tax.toString()) || 0;

    let discountAmount = 0;
    if (discountType === 'percentage') {
        const val = Math.min(discountValue, 100);
        discountAmount = (subtotal * val) / 100;
    } else {
        discountAmount = Math.min(discountValue, subtotal);
    }

    // Ensure discount amount is not NaN
    discountAmount = isNaN(discountAmount) ? 0 : discountAmount;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableAmount * taxValue) / 100;
    const total = taxableAmount + taxAmount;

    const handleSubmit = () => {
        onSubmit({
            ...invoiceData,
            discount: discountValue, // Provide clean numbers to parent
            tax: taxValue,
            discount_type: discountType,
            items: items.map(item => ({
                ...item,
                qty: parseFloat(item.qty.toString()) || 0,
                rate: parseFloat(item.rate.toString()) || 0
            })),
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
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-100 px-4 py-4 sm:px-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Create Invoice</h2>
                            <p className="text-gray-500 text-sm mt-0.5 max-w-[200px] truncate sm:max-w-none">
                                {appointment?.patient_name || appointment?.patient}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/50">
                        {/* Date Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Invoice Date"
                                type="date"
                                value={invoiceData.date}
                                onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                            />
                            <InputField
                                label="Due Date"
                                type="date"
                                value={invoiceData.dueDate}
                                onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                        </div>

                        {/* Load Procedures Button */}
                        {completedProcedures.length > 0 && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-blue-900 text-sm">Quick Add Procedures</p>
                                    <p className="text-xs text-blue-600 mt-0.5">{completedProcedures.length} completed procedure(s) ready to bill.</p>
                                </div>
                                <Button onClick={loadCompletedProcedures} variant="outline" size="sm" className="w-full sm:w-auto text-blue-700 border-blue-200 hover:bg-blue-50">
                                    Load All
                                </Button>
                            </div>
                        )}

                        {/* Items Section */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-gray-900">Items</h3>
                                <Button onClick={addItem} size="sm" variant="ghost" className="text-primary-600 hover:bg-primary-50">+ Add Item</Button>
                            </div>

                            <div className="space-y-6">
                                {/* Desktop Headers */}
                                <div className="hidden sm:grid grid-cols-12 gap-4 px-1 mb-1">
                                    <div className="col-span-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</div>
                                    <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</div>
                                    <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-7">Rate</div>
                                    <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</div>
                                </div>

                                {items.map((item, index) => (
                                    <div key={item.id} className="relative group">
                                        <div className="grid grid-cols-12 gap-3 sm:gap-4 items-start">
                                            {/* Description - Full width on mobile, 6 cols on desktop */}
                                            <div className="col-span-12 sm:col-span-5">
                                                <div className="block sm:hidden text-xs font-semibold text-gray-500 mb-1">Description</div>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                                                    placeholder="Item name"
                                                    list={`procedures-${item.id}`}
                                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                />
                                                <datalist id={`procedures-${item.id}`}>
                                                    {procedures.map(proc => (
                                                        <option key={proc.procedure_name} value={proc.procedure_name}>
                                                            {proc.code} - ₹{proc.cost}
                                                        </option>
                                                    ))}
                                                </datalist>
                                            </div>

                                            {/* Qty - 3 cols mobile, 2 cols desktop */}
                                            <div className="col-span-4 sm:col-span-2">
                                                <div className="block sm:hidden text-xs font-semibold text-gray-500 mb-1">Qty</div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                            </div>

                                            {/* Rate - 4 cols mobile, 2 cols desktop */}
                                            <div className="col-span-4 sm:col-span-3">
                                                <div className="block sm:hidden text-xs font-semibold text-gray-500 mb-1">Rate</div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.rate}
                                                        onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                                                        className="w-full h-10 pl-7 pr-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Total - 3 cols mobile, 2 cols desktop - and Delete */}
                                            <div className="col-span-4 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 h-10 mt-6 sm:mt-0">
                                                <div className="font-medium text-gray-900">
                                                    ₹{((parseFloat(item.qty.toString()) || 0) * (parseFloat(item.rate.toString()) || 0)).toLocaleString()}
                                                </div>
                                                {items.length > 1 && (
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                                                        title="Remove item"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Divider for mobile */}
                                        {index < items.length - 1 && <div className="h-px bg-gray-100 my-4 sm:hidden" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes / Terms</label>
                                <textarea
                                    value={invoiceData.notes}
                                    onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={4}
                                    placeholder="Payment terms, bank details, etc."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm transition-shadow"
                                />
                            </div>

                            {/* Totals Section */}
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {/* Discount Row with Toggle */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Discount</span>
                                            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                                <button
                                                    onClick={() => setDiscountType('amount')}
                                                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md transition-all ${discountType === 'amount' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    ₹
                                                </button>
                                                <button
                                                    onClick={() => setDiscountType('percentage')}
                                                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md transition-all ${discountType === 'percentage' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    %
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <input
                                                type="number"
                                                min="0"
                                                value={invoiceData.discount}
                                                onChange={(e) => setInvoiceData(prev => ({ ...prev, discount: e.target.value }))}
                                                className="w-24 h-8 px-2 text-right border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                            <span className="w-20 text-right text-sm font-medium text-red-500">
                                                -₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tax Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <span className="text-sm text-gray-600">Tax (%)</span>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={invoiceData.tax}
                                                onChange={(e) => setInvoiceData(prev => ({ ...prev, tax: e.target.value }))}
                                                className="w-24 h-8 px-2 text-right border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                            <span className="w-20 text-right text-sm font-medium text-gray-900">
                                                ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-200 my-2"></div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-bold text-gray-900">Total Amount</span>
                                        <span className="text-xl font-bold text-primary-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 bg-white px-6 py-4 flex flex-shrink-0 items-center justify-end gap-3 z-10">
                        <Button onClick={onClose} variant="ghost" className="text-gray-600">Cancel</Button>
                        <Button onClick={handleSubmit} isLoading={isCreating} className="w-full sm:w-auto">
                            Create Invoice
                        </Button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default CreateInvoiceModal;
