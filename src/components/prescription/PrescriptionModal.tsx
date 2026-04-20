import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { medicineService, MedicineTemplate, PrescriptionDraft, PrescriptionMedicine } from '../../api/services/medicine';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import { useClinic } from '../../contexts/ClinicContext';

interface DoctorOption {
    id: string;
    name: string;
}

interface PrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    doctorOptions: DoctorOption[];
    defaultDoctorId?: string;
    onSubmit: (data: PrescriptionDraft) => void;
    isSubmitting?: boolean;
}

const DOSAGE_CONDITIONS = [
    '',
    'Before Food',
    'After Food',
    'With Food',
    'Empty Stomach',
    'Bedtime',
    'SOS',
];

const TIMING_FIELDS: Array<{ key: 'morning' | 'lunch' | 'night'; label: string }> = [
    { key: 'morning', label: 'MOR' },
    { key: 'lunch', label: 'LUN' },
    { key: 'night', label: 'NIG' },
];

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
    doctorOptions,
    defaultDoctorId,
    onSubmit,
    isSubmitting = false,
}) => {
    const { clinicId } = useClinic();
    const [medications, setMedications] = useState<PrescriptionMedicine[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [physicianNotes, setPhysicianNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MedicineTemplate[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resolvedDefaultDoctorId = useMemo(() => {
        if (defaultDoctorId && doctorOptions.some(option => option.id === defaultDoctorId)) {
            return defaultDoctorId;
        }

        return doctorOptions[0]?.id || '';
    }, [defaultDoctorId, doctorOptions]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setMedications([]);
        setSelectedDoctor(resolvedDefaultDoctorId);
        setPhysicianNotes('');
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchDropdown(false);
    }, [isOpen, resolvedDefaultDoctorId]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length < 2) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await medicineService.searchMedicines(value, 10, clinicId || undefined);
                setSearchResults(results);
                setShowSearchDropdown(true);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, [clinicId]);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const appendMedication = (medication: PrescriptionMedicine) => {
        setMedications(prev => [...prev, medication]);
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchDropdown(false);
        searchInputRef.current?.focus();
    };

    const handleSelectMedicine = (template: MedicineTemplate) => {
        appendMedication(medicineService.templateToMedicine(template));
    };

    const handleAddCustomMedicine = () => {
        if (!searchQuery.trim()) {
            return;
        }

        const customMedicine: PrescriptionMedicine = {
            ...medicineService.createEmptyMedicine(),
            medicine_name: searchQuery.trim(),
        };
        appendMedication(customMedicine);
    };

    const updateMedication = (id: string, field: keyof PrescriptionMedicine, value: string | number) => {
        setMedications(prev =>
            prev.map(med => (med.id === id ? { ...med, [field]: value } : med))
        );
    };

    const toggleTiming = (id: string, field: 'morning' | 'lunch' | 'night') => {
        setMedications(prev =>
            prev.map(med =>
                med.id === id ? { ...med, [field]: med[field] ? 0 : 1 } : med
            )
        );
    };

    const removeMedication = (id: string) => {
        setMedications(prev => prev.filter(med => med.id !== id));
    };

    const hasValidContent = medications.some(med => med.medicine_name.trim()) || Boolean(physicianNotes.trim());

    const handleSubmit = () => {
        const validMedications = medications.filter(med => med.medicine_name.trim());

        if (!validMedications.length && !physicianNotes.trim()) {
            toast.error('Add at least one medicine or physician notes');
            return;
        }

        onSubmit({
            practitioner: selectedDoctor || undefined,
            physicianNotes: physicianNotes.trim(),
            medications: validMedications,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pb-[90px] md:p-6 md:pb-6">
            <div
                className="relative z-50 flex w-full max-h-full max-w-6xl flex-col rounded-xl bg-white shadow-xl"
                onClick={event => event.stopPropagation()}
            >
                <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 p-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add Prescription</h2>
                        <p className="text-sm font-medium text-primary-600">
                            Prescription Details: {patientName || patientId}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 transition-colors hover:bg-gray-100"
                        disabled={isSubmitting}
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div
                    className="flex-1 min-h-0 overflow-y-auto space-y-5 p-4 pb-6 touch-pan-y"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="grid gap-4 md:grid-cols-[240px,1fr]">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Doctor</label>
                            <div className="relative">
                                <select
                                    value={selectedDoctor}
                                    onChange={event => setSelectedDoctor(event.target.value)}
                                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    disabled={isSubmitting}
                                >
                                    {doctorOptions.map(option => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                                    <svg className="h-[14px] w-[14px] text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Medicine</label>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={event => handleSearchChange(event.target.value)}
                                onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                                placeholder="Search medicine name"
                                className="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />

                            {isSearching && (
                                <div className="absolute right-3 top-[50px]">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                                </div>
                            )}

                            {showSearchDropdown && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                    {searchResults.length > 0 ? (
                                        searchResults.map(med => (
                                            <button
                                                key={med.name}
                                                type="button"
                                                onClick={() => handleSelectMedicine(med)}
                                                className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-blue-50 last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900">{med.medicine_name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {med.dosage_form} {med.strength && `• ${med.strength}`} • {med.category}
                                                </div>
                                            </button>
                                        ))
                                    ) : searchQuery.length >= 2 && !isSearching ? (
                                        <button
                                            type="button"
                                            onClick={handleAddCustomMedicine}
                                            className="w-full px-4 py-3 text-left hover:bg-blue-50"
                                        >
                                            <div className="font-medium text-primary-600">+ Add "{searchQuery}" as custom medicine</div>
                                        </button>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-hidden rounded-xl border border-gray-200">
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full min-w-[960px] text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-gray-200">
                                        <th className="px-3 py-3 text-left font-medium text-gray-700">Medicine</th>
                                        <th className="px-3 py-3 text-left font-medium text-gray-700">Dosage</th>
                                        <th className="px-3 py-3 text-left font-medium text-gray-700">Frequency</th>
                                        <th className="px-3 py-3 text-left font-medium text-gray-700">Conditions</th>
                                        <th className="px-3 py-3 text-left font-medium text-gray-700">Days</th>
                                        <th className="px-3 py-3 text-left font-medium text-gray-700">Note</th>
                                        <th className="w-12 px-2 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {medications.map(med => (
                                        <tr key={med.id} className="border-b border-gray-100 align-top last:border-b-0">
                                            <td className="px-3 py-3">
                                                <input
                                                    type="text"
                                                    value={med.medicine_name}
                                                    onChange={event => updateMedication(med.id, 'medicine_name', event.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Medicine name"
                                                />
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="text"
                                                    value={med.dosage || ''}
                                                    onChange={event => updateMedication(med.id, 'dosage', event.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="1 Tablet / 10 ml"
                                                />
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex gap-2">
                                                    {TIMING_FIELDS.map(timing => {
                                                        const isActive = Boolean(med[timing.key]);

                                                        return (
                                                            <button
                                                                key={timing.key}
                                                                type="button"
                                                                onClick={() => toggleTiming(med.id, timing.key)}
                                                                className={`rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${isActive
                                                                        ? 'border-primary-500 bg-primary-500 text-white'
                                                                        : 'border-gray-300 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600'
                                                                    }`}
                                                            >
                                                                {timing.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="relative">
                                                    <select
                                                        value={med.condition}
                                                        onChange={event => updateMedication(med.id, 'condition', event.target.value)}
                                                        className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    >
                                                        {DOSAGE_CONDITIONS.map(condition => (
                                                            <option key={condition || 'none'} value={condition}>
                                                                {condition || 'Select condition'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <svg className="h-[14px] w-[14px] text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    value={med.days || ''}
                                                    onChange={event => updateMedication(med.id, 'days', parseInt(event.target.value, 10) || 0)}
                                                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="text"
                                                    value={med.note || ''}
                                                    onChange={event => updateMedication(med.id, 'note', event.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="add note.."
                                                />
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedication(med.id)}
                                                    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                                                    title="Remove medicine"
                                                >
                                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards Layout */}
                        <div className="lg:hidden flex flex-col">
                            {medications.map(med => (
                                <div key={med.id} className="p-4 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex-1 font-bold text-lg text-primary-700">
                                            {med.medicine_name}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeMedication(med.id)}
                                            className="ml-2 text-red-500 hover:text-red-700 p-1"
                                            title="Remove medicine"
                                        >
                                            <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Dosage</label>
                                            <input
                                                type="text"
                                                value={med.dosage || ''}
                                                onChange={event => updateMedication(med.id, 'dosage', event.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="1 Tablet"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={med.days || ''}
                                                onChange={event => updateMedication(med.id, 'days', parseInt(event.target.value, 10) || 0)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Frequency</label>
                                        <div className="flex gap-1 justify-between">
                                            {TIMING_FIELDS.map(timing => {
                                                const isActive = Boolean(med[timing.key]);
                                                return (
                                                    <button
                                                        key={timing.key}
                                                        type="button"
                                                        onClick={() => toggleTiming(med.id, timing.key)}
                                                        className={`flex-1 rounded border py-1.5 text-xs font-semibold tracking-wide transition-colors ${isActive
                                                                ? 'border-primary-500 bg-primary-500 text-white'
                                                                : 'border-gray-300 bg-white text-gray-600'
                                                            }`}
                                                    >
                                                        {timing.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Conditions</label>
                                        <div className="relative">
                                            <select
                                                value={med.condition}
                                                onChange={event => updateMedication(med.id, 'condition', event.target.value)}
                                                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                {DOSAGE_CONDITIONS.map(condition => (
                                                    <option key={condition || 'none'} value={condition}>
                                                        {condition || 'Condition'}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                <svg className="h-[14px] w-[14px] text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</label>
                                        <input
                                            type="text"
                                            value={med.note || ''}
                                            onChange={event => updateMedication(med.id, 'note', event.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g. Swallow with warm water"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {medications.length === 0 && (
                            <div className="px-4 py-10 text-center text-gray-500">
                                Search for a medicine above to add it, or create a notes-only prescription below.
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Physician Notes</label>
                        <textarea
                            value={physicianNotes}
                            onChange={event => setPhysicianNotes(event.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Additional instructions or diagnosis remarks.."
                        />
                    </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-between rounded-b-xl border-t border-gray-200 bg-gray-50 p-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !hasValidContent}
                        className="px-6"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Prescription'}
                    </Button>
                </div>
            </div>

            {showSearchDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSearchDropdown(false)}
                />
            )}
        </div>
    );
};

export default PrescriptionModal;
