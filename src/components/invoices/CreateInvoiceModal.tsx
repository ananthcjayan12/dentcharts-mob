import React, { useState, useEffect, useMemo, useRef } from 'react';
import Portal from '../common/Portal';
import Button from '../common/Button';
import InputField from '../common/InputField';
import { useProcedures } from '../../hooks/useProcedures';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePractitioners } from '../../hooks/usePractitioners';
import { usePatientsForSelect } from '../../hooks/usePatients';
import { clinicProfileService, ClinicConsultant } from '../../api/services/clinicProfile';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface InvoiceItem {
    id: string;
    description: string;
    item_code: string;
    qty: number | string;
    rate: number | string;
    consultant_enabled?: boolean;
    consultant_id?: string;
    consultant_commission_type?: 'Percentage' | 'Fixed';
    consultant_commission_value?: number | string;
    consultant_override?: boolean;
}

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment?: any;
    initialPatient?: { patient_id: string; patient_name?: string } | null;
    completedProcedures?: any[];
    onSubmit: (data: any) => void;
    isCreating: boolean;
    allowPatientSelection?: boolean;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
    isOpen,
    onClose,
    appointment,
    initialPatient = null,
    completedProcedures = [],
    onSubmit,
    isCreating,
    allowPatientSelection = false,
}) => {
    const { procedures } = useProcedures();
    const { clinicId } = useClinic();
    const { user } = useAuth();
    const { data: practitionersData } = usePractitioners();
    const practitioners = useMemo(() => practitionersData?.data || [], [practitionersData]);

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
    const [consultants, setConsultants] = useState<ClinicConsultant[]>([]);
    const [associatedPractitionerId, setAssociatedPractitionerId] = useState('');
    const initializedAppointmentKeyRef = useRef<string | null>(null);
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<{ patient_id: string; patient_name: string } | null>(null);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const { data: patientSearchResults = [] } = usePatientsForSelect(patientSearch);

    const [items, setItems] = useState<InvoiceItem[]>([{
        id: Date.now().toString(),
        description: '',
        item_code: '',
        qty: 1,
        rate: 0,
        consultant_enabled: false,
        consultant_id: '',
        consultant_commission_type: 'Percentage',
        consultant_commission_value: '',
        consultant_override: false,
    }]);

    useEffect(() => {
        if (!isOpen || !clinicId) {
            return;
        }

        let isMounted = true;

        clinicProfileService
            .getClinicConsultants(clinicId)
            .then((response) => {
                if (isMounted) {
                    setConsultants((response.consultants || []).filter((consultant) => consultant.is_active));
                }
            })
            .catch(() => {
                if (isMounted) {
                    setConsultants([]);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [clinicId, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            initializedAppointmentKeyRef.current = null;
            setAssociatedPractitionerId('');
            setPatientSearch('');
            setSelectedPatient(null);
            setShowPatientDropdown(false);
            return;
        }

        const resolvePractitionerOption = (...candidates: Array<string | undefined>) => {
            const normalizedCandidates = candidates
                .map((value) => (value || '').trim())
                .filter(Boolean);

            for (const candidate of normalizedCandidates) {
                const matchedPractitioner = practitioners.find(
                    (practitioner) =>
                        practitioner.name === candidate || practitioner.practitioner_name === candidate
                );
                if (matchedPractitioner) {
                    return matchedPractitioner.name;
                }
            }

            return '';
        };

        const appointmentKey =
            appointment?.name ||
            appointment?.appointment_id ||
            appointment?.practitioner ||
            appointment?.practitioner_id ||
            appointment?.practitioner_name ||
            '__new_invoice__';

        if (initializedAppointmentKeyRef.current === appointmentKey) {
            return;
        }

        const appointmentPractitioner = resolvePractitionerOption(
            appointment?.practitioner,
            appointment?.practitioner_id,
            appointment?.practitioner_name
        );

        if (appointmentPractitioner) {
            setAssociatedPractitionerId(appointmentPractitioner);
            initializedAppointmentKeyRef.current = appointmentKey;
            return;
        }

        const loggedInPractitioner = resolvePractitionerOption(
            user?.practitioner_id,
            user?.name,
            user?.full_name
        );

        if (loggedInPractitioner) {
            setAssociatedPractitionerId(loggedInPractitioner);
            initializedAppointmentKeyRef.current = appointmentKey;
            return;
        }

        if (practitioners.length === 1) {
            setAssociatedPractitionerId(practitioners[0].name);
            initializedAppointmentKeyRef.current = appointmentKey;
        }
    }, [appointment, practitioners, isOpen, user?.practitioner_id, user?.name, user?.full_name]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const appointmentPatientId = appointment?.patient || appointment?.patient_id;
        const appointmentPatientName = appointment?.patient_name || appointmentPatientId;

        if (appointmentPatientId) {
            setSelectedPatient({
                patient_id: appointmentPatientId,
                patient_name: appointmentPatientName,
            });
            setPatientSearch(appointmentPatientName || '');
            setShowPatientDropdown(false);
            return;
        }

        if (initialPatient?.patient_id) {
            const patientName = initialPatient.patient_name || initialPatient.patient_id;
            setSelectedPatient({
                patient_id: initialPatient.patient_id,
                patient_name: patientName,
            });
            setPatientSearch(patientName);
            setShowPatientDropdown(false);
            return;
        }

        if (!allowPatientSelection) {
            setSelectedPatient(null);
            setPatientSearch('');
            setShowPatientDropdown(false);
        }
    }, [appointment, allowPatientSelection, initialPatient, isOpen]);

    const addItem = () => {
        setItems([...items, {
            id: Date.now().toString(),
            description: '',
            item_code: '',
            qty: 1,
            rate: 0,
            consultant_enabled: false,
            consultant_id: '',
            consultant_commission_type: 'Percentage',
            consultant_commission_value: '',
            consultant_override: false,
        }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        setItems(items.map(item => {
            if (item.id !== id) return item;
            if (field === 'qty' || field === 'rate' || field === 'consultant_commission_value') {
                const input = String(value);
                if (input === '') return { ...item, [field]: '' };
                const num = parseFloat(input);
                return { ...item, [field]: isNaN(num) ? '' : num };
            }
            return { ...item, [field]: value };
        }));
    };

    const getConsultantById = (consultantId?: string) =>
        consultants.find((consultant) => consultant.consultant_id === consultantId);

    const applyConsultantDefaults = (itemId: string, consultantId: string) => {
        const consultant = getConsultantById(consultantId);
        setItems((previous) =>
            previous.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        consultant_enabled: Boolean(consultantId),
                        consultant_id: consultantId,
                        consultant_override: false,
                        consultant_commission_type: consultant?.commission_type || 'Percentage',
                        consultant_commission_value: consultant?.commission_value ?? '',
                    }
                    : item
            )
        );
    };

    const calculateLineAmount = (item: InvoiceItem) => {
        const qty = parseFloat(item.qty.toString()) || 0;
        const rate = parseFloat(item.rate.toString()) || 0;
        return qty * rate;
    };

    const calculateLineCommission = (item: InvoiceItem) => {
        if (!item.consultant_enabled || !item.consultant_id) {
            return 0;
        }

        const commissionValue = parseFloat(String(item.consultant_commission_value)) || 0;
        if (item.consultant_commission_type === 'Fixed') {
            return commissionValue;
        }

        return (calculateLineAmount(item) * commissionValue) / 100;
    };

    const normalizeProcedureLabel = (value: string) =>
        value.trim().replace(/\s+/g, ' ');

    const getProcedureLabelCandidates = (value: string) => {
        const normalized = normalizeProcedureLabel(value);
        if (!normalized) {
            return [];
        }

        return [normalized];
    };

    const findMatchingProcedure = (value: string, explicitCode?: string) => {
        const normalizedCode = (explicitCode || '').trim().toLowerCase();
        if (normalizedCode) {
            const codeMatch = procedures.find(
                (procedure) => (procedure.code || '').trim().toLowerCase() === normalizedCode
            );
            if (codeMatch) {
                return codeMatch;
            }
        }

        const candidates = getProcedureLabelCandidates(value);
        if (candidates.length === 0) {
            return undefined;
        }

        return procedures.find((procedure) =>
            candidates.includes(normalizeProcedureLabel(procedure.procedure_name || ''))
        );
    };

    const handleDescriptionChange = (id: string, value: string) => {
        const selectedProcedure = findMatchingProcedure(value, value);

        setItems(items.map(item => {
            if (item.id === id) {
                if (selectedProcedure) {
                    return {
                        ...item,
                        description: selectedProcedure.procedure_name,
                        item_code: selectedProcedure.code || '',
                        rate: selectedProcedure.cost || 0
                    };
                }
                return { ...item, description: value, item_code: '' };
            }
            return item;
        }));
    };

    const loadCompletedProcedures = () => {
        if (completedProcedures.length === 0) {
            alert('No completed procedures found for this appointment');
            return;
        }

        const procedureItems = completedProcedures.map(proc => {
            const rawDescription = proc.procedure_name || proc.name || '';
            const matchedProcedure = findMatchingProcedure(rawDescription, proc.code);

            return {
                id: Date.now().toString() + Math.random(),
                description: rawDescription,
                item_code: matchedProcedure?.code || proc.code || '',
                qty: 1,
                rate: proc.cost || matchedProcedure?.cost || 0
            };
        });

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
        if (!selectedPatient?.patient_id) {
            alert('Please select the patient for this invoice');
            return;
        }

        if (!associatedPractitionerId) {
            alert('Please select the doctor associated with this invoice');
            return;
        }

        if (items.some((item) => item.consultant_enabled && !item.consultant_id)) {
            alert('Please select a consultant for each enabled commission row');
            return;
        }

        if (items.some((item) => item.consultant_enabled && String(item.consultant_commission_value ?? '') === '')) {
            alert('Please enter a consultant commission value');
            return;
        }

        onSubmit({
            ...invoiceData,
            patient_id: selectedPatient.patient_id,
            patient_name: selectedPatient.patient_name,
            practitioner_id: associatedPractitionerId,
            discount: discountValue, // Provide clean numbers to parent
            tax: taxValue,
            discount_type: discountType,
            items: items.map(item => {
                const matchedProcedure = findMatchingProcedure(item.description, item.item_code);

                return {
                    ...item,
                    description: item.description,
                    item_code: matchedProcedure?.code || item.item_code,
                    qty: parseFloat(item.qty.toString()) || 0,
                    rate: parseFloat(item.rate.toString()) || 0,
                    consultant: item.consultant_enabled && item.consultant_id
                        ? {
                            consultant_id: item.consultant_id,
                            commission_type: item.consultant_commission_type || 'Percentage',
                            commission_value: parseFloat(String(item.consultant_commission_value)) || 0,
                            override: Boolean(item.consultant_override),
                        }
                        : undefined,
                };
            }),
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
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-100 px-4 py-4 sm:px-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Create Invoice</h2>
                            <p className="text-gray-500 text-sm mt-0.5 max-w-[200px] truncate sm:max-w-none">
                                {selectedPatient?.patient_name || appointment?.patient_name || appointment?.patient || 'Select patient'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-6 bg-gray-50/50">
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

                        {(allowPatientSelection || !selectedPatient?.patient_id) && (
                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Patient</label>
                                <input
                                    type="text"
                                    value={patientSearch}
                                    onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setPatientSearch(nextValue);
                                        setShowPatientDropdown(true);
                                        if (!nextValue.trim()) {
                                            setSelectedPatient(null);
                                            return;
                                        }
                                        if (selectedPatient && nextValue !== selectedPatient.patient_name) {
                                            setSelectedPatient(null);
                                        }
                                    }}
                                    onFocus={() => {
                                        if (patientSearch.trim().length >= 2) {
                                            setShowPatientDropdown(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        window.setTimeout(() => setShowPatientDropdown(false), 150);
                                    }}
                                    placeholder="Search patient by name or ID"
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                                {showPatientDropdown && patientSearch.trim().length >= 2 && patientSearchResults.length > 0 && (
                                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                                        {patientSearchResults.map((patient: any) => {
                                            const patientId = patient.patient_id || patient.name;
                                            const patientName = patient.patient_name || patient.name;
                                            return (
                                                <button
                                                    key={patientId}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPatient({ patient_id: patientId, patient_name: patientName });
                                                        setPatientSearch(patientName);
                                                        setShowPatientDropdown(false);
                                                    }}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-50"
                                                >
                                                    <div className="text-sm font-semibold text-gray-900">{patientName}</div>
                                                    <div className="text-xs text-gray-500">{patientId}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Associated Doctor</label>
                            <select
                                value={associatedPractitionerId}
                                onChange={(e) => setAssociatedPractitionerId(e.target.value)}
                                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Select doctor</option>
                                {practitioners.map((practitioner) => (
                                    <option key={practitioner.name} value={practitioner.name}>
                                        {practitioner.practitioner_name}
                                    </option>
                                ))}
                            </select>
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

                                            {/* Qty - 6 cols mobile, 2 cols desktop */}
                                            <div className="col-span-6 sm:col-span-2">
                                                <div className="block sm:hidden text-xs font-semibold text-gray-500 mb-1">Qty</div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                            </div>

                                            {/* Rate - 6 cols mobile, 3 cols desktop */}
                                            <div className="col-span-6 sm:col-span-3">
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

                                            {/* Total - Full width mobile, 2 cols desktop - and Delete */}
                                            <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 h-10 mt-2 sm:mt-0">
                                                <div className="font-medium text-gray-900">
                                                    ₹{calculateLineAmount(item).toLocaleString()}
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
                                        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(item.consultant_enabled)}
                                                        onChange={(event) => {
                                                            if (!event.target.checked) {
                                                                setItems((previous) =>
                                                                    previous.map((row) =>
                                                                        row.id === item.id
                                                                            ? {
                                                                                ...row,
                                                                                consultant_enabled: false,
                                                                                consultant_id: '',
                                                                                consultant_commission_type: 'Percentage',
                                                                                consultant_commission_value: '',
                                                                                consultant_override: false,
                                                                            }
                                                                            : row
                                                                    )
                                                                );
                                                                return;
                                                            }

                                                            const firstConsultant = consultants[0];
                                                            applyConsultantDefaults(item.id, firstConsultant?.consultant_id || '');
                                                        }}
                                                        disabled={consultants.length === 0}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                    Add Consultant Commission
                                                </label>
                                                {consultants.length === 0 && (
                                                    <span className="text-xs text-gray-500">No active consultants configured in settings</span>
                                                )}
                                            </div>

                                            {item.consultant_enabled && (
                                                <div className="mt-3 space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Consultant</label>
                                                            <select
                                                                value={item.consultant_id || ''}
                                                                onChange={(event) => applyConsultantDefaults(item.id, event.target.value)}
                                                                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                            >
                                                                <option value="">Select consultant</option>
                                                                {consultants.map((consultant) => (
                                                                    <option key={consultant.consultant_id} value={consultant.consultant_id}>
                                                                        {consultant.consultant_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                                                            <select
                                                                value={item.consultant_commission_type || 'Percentage'}
                                                                onChange={(event) => updateItem(item.id, 'consultant_commission_type', event.target.value)}
                                                                disabled={!item.consultant_override}
                                                                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                                                            >
                                                                <option value="Percentage">%</option>
                                                                <option value="Fixed">Fixed</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                                {item.consultant_commission_type === 'Fixed' ? 'Amount' : 'Rate'}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.consultant_commission_value ?? ''}
                                                                onChange={(event) => updateItem(item.id, 'consultant_commission_value', event.target.value)}
                                                                disabled={!item.consultant_override}
                                                                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={Boolean(item.consultant_override)}
                                                                onChange={(event) => {
                                                                    const isOverride = event.target.checked;
                                                                    const consultant = getConsultantById(item.consultant_id);
                                                                    setItems((previous) =>
                                                                        previous.map((row) =>
                                                                            row.id === item.id
                                                                                ? {
                                                                                    ...row,
                                                                                    consultant_override: isOverride,
                                                                                    consultant_commission_type: isOverride
                                                                                        ? row.consultant_commission_type || consultant?.commission_type || 'Percentage'
                                                                                        : consultant?.commission_type || 'Percentage',
                                                                                    consultant_commission_value: isOverride
                                                                                        ? (row.consultant_commission_value === '' ? (consultant?.commission_value ?? '') : row.consultant_commission_value)
                                                                                        : (consultant?.commission_value ?? ''),
                                                                                }
                                                                                : row
                                                                        )
                                                                    );
                                                                }}
                                                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                            />
                                                            Override default commission
                                                        </label>
                                                        <div className="rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                                                            Commission: ₹{calculateLineCommission(item).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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
                                        <div className="flex min-w-0 items-center gap-2 w-full sm:w-auto">
                                            <input
                                                type="number"
                                                min="0"
                                                value={invoiceData.discount}
                                                onChange={(e) => setInvoiceData(prev => ({ ...prev, discount: e.target.value }))}
                                                className="w-20 sm:w-24 h-8 px-2 text-right border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                            <span className="min-w-[68px] sm:w-20 text-right text-sm font-medium text-red-500">
                                                -₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tax Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <span className="text-sm text-gray-600">Tax (%)</span>
                                        <div className="flex min-w-0 items-center gap-2 w-full sm:w-auto">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={invoiceData.tax}
                                                onChange={(e) => setInvoiceData(prev => ({ ...prev, tax: e.target.value }))}
                                                className="w-20 sm:w-24 h-8 px-2 text-right border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                            <span className="min-w-[68px] sm:w-20 text-right text-sm font-medium text-gray-900">
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
                    <div className="border-t border-gray-100 bg-white px-4 sm:px-6 py-4 flex flex-shrink-0 items-center gap-3 z-10 w-full overflow-hidden">
                        <Button onClick={onClose} variant="ghost" className="flex-1 sm:flex-none text-gray-600 sm:w-auto">Cancel</Button>
                        <Button onClick={handleSubmit} isLoading={isCreating} className="flex-[2] sm:flex-none sm:w-auto whitespace-nowrap overflow-hidden text-ellipsis">
                            Create Invoice
                        </Button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default CreateInvoiceModal;
