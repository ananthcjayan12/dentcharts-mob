/**
 * PrescriptionModal - New prescription modal with table-based layout
 * Features:
 * - Medicine search autocomplete
 * - Table layout with Morning/Lunch/Evening/Night columns
 * - Special conditions dropdown
 * - Days field
 * - Downloadable/printable prescription
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { medicineService, MedicineTemplate, PrescriptionMedicine } from '../../api/services/medicine';
import Button from '../common/Button';
import toast from 'react-hot-toast';

interface PrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    onSubmit: (medications: PrescriptionMedicine[]) => void;
    isSubmitting?: boolean;
}

const DOSAGE_CONDITIONS = [
    'After Food',
    'Before Food',
    'With Food',
    'Empty Stomach',
    'As Needed',
    'Bedtime',
];

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
    onSubmit,
    isSubmitting = false,
}) => {
    const [medications, setMedications] = useState<PrescriptionMedicine[]>([
        medicineService.createEmptyMedicine(),
    ]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MedicineTemplate[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setMedications([medicineService.createEmptyMedicine()]);
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isOpen]);

    // Debounced search
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length < 2) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await medicineService.searchMedicines(value, 10);
                setSearchResults(results);
                setShowSearchDropdown(true);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, []);

    // Add medicine from search results
    const handleSelectMedicine = (template: MedicineTemplate) => {
        const newMed = medicineService.templateToMedicine(template);
        setMedications(prev => [...prev, newMed]);
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchDropdown(false);
        searchInputRef.current?.focus();
    };

    // Add custom medicine (not from templates)
    const handleAddCustomMedicine = () => {
        if (!searchQuery.trim()) return;

        const customMed: PrescriptionMedicine = {
            ...medicineService.createEmptyMedicine(),
            medicine_name: searchQuery.trim(),
        };
        setMedications(prev => [...prev, customMed]);
        setSearchQuery('');
        setShowSearchDropdown(false);
    };

    // Update medication field
    const updateMedication = (id: string, field: keyof PrescriptionMedicine, value: any) => {
        setMedications(prev =>
            prev.map(med => (med.id === id ? { ...med, [field]: value } : med))
        );
    };

    // Remove medication
    const removeMedication = (id: string) => {
        setMedications(prev => prev.filter(med => med.id !== id));
    };

    // Handle submit
    const handleSubmit = () => {
        const validMeds = medications.filter(med => med.medicine_name.trim());
        if (validMeds.length === 0) {
            toast.error('Please add at least one medication');
            return;
        }
        onSubmit(validMeds);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add Prescription</h2>
                        <p className="text-sm text-primary-600 font-medium">
                            Prescription Details: {patientName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={isSubmitting}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => handleSearchChange(e.target.value)}
                            onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                            placeholder="Search medicine name"
                            className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {/* Search Dropdown */}
                        {showSearchDropdown && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                                {searchResults.length > 0 ? (
                                    <>
                                        {searchResults.map(med => (
                                            <button
                                                key={med.name}
                                                type="button"
                                                onClick={() => handleSelectMedicine(med)}
                                                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900">{med.medicine_name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {med.dosage_form} {med.strength && `• ${med.strength}`} • {med.category}
                                                </div>
                                            </button>
                                        ))}
                                    </>
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

                    {/* Medications Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-2 font-medium text-gray-700" style={{ minWidth: '180px' }}>Medicine</th>
                                    <th className="text-center py-2 px-1 font-medium text-gray-700" style={{ width: '60px' }}>Morning</th>
                                    <th className="text-center py-2 px-1 font-medium text-gray-700" style={{ width: '60px' }}>Lunch</th>
                                    <th className="text-center py-2 px-1 font-medium text-gray-700" style={{ width: '60px' }}>Evening</th>
                                    <th className="text-center py-2 px-1 font-medium text-gray-700" style={{ width: '60px' }}>Night</th>
                                    <th className="text-center py-2 px-1 font-medium text-gray-700" style={{ minWidth: '130px' }}>Special Conditions</th>
                                    <th className="text-center py-2 px-1 font-medium text-gray-700" style={{ width: '60px' }}>Days</th>
                                    <th className="text-center py-2 px-1" style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {medications.filter(m => m.medicine_name.trim()).map(med => (
                                    <tr key={med.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-2">
                                            <input
                                                type="text"
                                                value={med.medicine_name}
                                                onChange={e => updateMedication(med.id, 'medicine_name', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                placeholder="Medicine name"
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="9"
                                                value={med.morning}
                                                onChange={e => updateMedication(med.id, 'morning', parseInt(e.target.value) || 0)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-center text-sm"
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="9"
                                                value={med.lunch}
                                                onChange={e => updateMedication(med.id, 'lunch', parseInt(e.target.value) || 0)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-center text-sm"
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="9"
                                                value={med.evening}
                                                onChange={e => updateMedication(med.id, 'evening', parseInt(e.target.value) || 0)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-center text-sm"
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="9"
                                                value={med.night}
                                                onChange={e => updateMedication(med.id, 'night', parseInt(e.target.value) || 0)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-center text-sm"
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <select
                                                value={med.condition}
                                                onChange={e => updateMedication(med.id, 'condition', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                            >
                                                {DOSAGE_CONDITIONS.map(cond => (
                                                    <option key={cond} value={cond}>{cond}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-2 px-1">
                                            <input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={med.days}
                                                onChange={e => updateMedication(med.id, 'days', parseInt(e.target.value) || 1)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-center text-sm"
                                            />
                                        </td>
                                        <td className="py-2 px-1 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeMedication(med.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Remove"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {medications.filter(m => m.medicine_name.trim()).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Search for a medicine above to add it to the prescription
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex justify-end">
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting || medications.filter(m => m.medicine_name.trim()).length === 0}
                        className="px-6"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Prescription'}
                    </Button>
                </div>
            </div>

            {/* Click outside to close dropdown */}
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
