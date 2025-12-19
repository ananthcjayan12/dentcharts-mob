
import React, { useState, useEffect } from 'react';
import Portal from '../common/Portal';
import Button from '../common/Button';
import InputField from '../common/InputField';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useUpdatePatient } from '../../hooks/usePatients';
import { PatientResponse } from '../../api/types';

interface EditPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientResponse;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({
    isOpen,
    onClose,
    patient
}) => {
    const { mutate: updatePatient, isPending: isUpdating } = useUpdatePatient();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        mobile: '',
        email: '',
        dob: '',
        sex: '',
        address: '',
        blood_group: '',
        occupation: ''
    });

    useEffect(() => {
        if (patient) {
            // Split patient_name if first/last not available
            let first = patient.patient_name || '';
            let last = '';
            // Since patient_name is usually "First Last" in Frappe
            if (!patient.patient_name && patient.name) {
                first = patient.name;
            } else if (patient.patient_name.includes(' ')) {
                const parts = patient.patient_name.split(' ');
                last = parts.pop() || '';
                first = parts.join(' ');
            }

            setFormData({
                first_name: first, // API doesn't return separate first/last usually unless custom, so we infer
                last_name: last,
                mobile: patient.mobile || '',
                email: patient.email || '',
                dob: typeof patient.dob === 'string' ? patient.dob : '',
                sex: patient.sex || '',
                address: patient.address || '',
                blood_group: patient.blood_group || '',
                occupation: patient.occupation || ''
            });
        }
    }, [patient]);

    const handleSubmit = () => {
        if (!patient.patient_id && !patient.name) return;

        updatePatient({
            patient_id: patient.patient_id || patient.name,
            ...formData,
            // Construct full name if needed or let backend handle it
            patient_name: `${formData.first_name} ${formData.last_name}`.trim(),
            sex: formData.sex as any
        }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Edit Patient Profile</h2>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                                label="First Name"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                            <InputField
                                label="Last Name"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                            <InputField
                                label="Mobile Number"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            />
                            <InputField
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                <select
                                    value={formData.sex}
                                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <InputField
                                label="Date of Birth"
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            />
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                                <select
                                    value={formData.blood_group}
                                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                >
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <InputField
                                label="Occupation"
                                value={formData.occupation}
                                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            />
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={3}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 bg-white px-6 py-4 flex flex-shrink-0 items-center justify-end gap-3">
                        <Button onClick={onClose} variant="ghost" className="text-gray-600">Cancel</Button>
                        <Button onClick={handleSubmit} isLoading={isUpdating}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default EditPatientModal;
