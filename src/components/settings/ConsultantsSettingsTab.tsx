import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import Card from '../common/Card';
import Button from '../common/Button';
import InputField from '../common/InputField';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePractitioners } from '../../hooks/usePractitioners';
import { clinicProfileService, ClinicConsultant } from '../../api/services/clinicProfile';

type ConsultantFormState = {
    consultant_id?: string;
    consultant_type: 'Internal' | 'External';
    practitioner?: string;
    consultant_name: string;
    mobile: string;
    commission_type: 'Percentage' | 'Fixed';
    commission_value: string;
    is_active: boolean;
    notes: string;
};

const EMPTY_FORM: ConsultantFormState = {
    consultant_type: 'Internal',
    practitioner: '',
    consultant_name: '',
    mobile: '',
    commission_type: 'Percentage',
    commission_value: '0',
    is_active: true,
    notes: '',
};

const ConsultantsSettingsTab: React.FC = () => {
    const { clinicId } = useClinic();
    const { user } = useAuth();
    const isClinicAdmin = Boolean(user?.permissions?.is_clinic_admin);
    const { data: practitionersData } = usePractitioners();
    const practitioners = practitionersData?.data || [];

    const [rows, setRows] = useState<ClinicConsultant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<ConsultantFormState>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadConsultants = useCallback(async () => {
        if (!clinicId || !isClinicAdmin) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await clinicProfileService.getClinicConsultants(clinicId);
            setRows(response.consultants || []);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to load consultants');
        } finally {
            setIsLoading(false);
        }
    }, [clinicId, isClinicAdmin]);

    useEffect(() => {
        loadConsultants();
    }, [loadConsultants]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const patchForm = (updates: Partial<ConsultantFormState>) => {
        setForm((previous) => ({ ...previous, ...updates }));
    };

    const applyPractitioner = (practitionerId: string) => {
        const practitioner = practitioners.find((row) => row.name === practitionerId);
        patchForm({
            practitioner: practitionerId,
            consultant_name: practitioner?.practitioner_name || '',
            mobile: practitioner?.mobile || '',
        });
    };

    const editRow = (row: ClinicConsultant) => {
        setEditingId(row.consultant_id);
        setForm({
            consultant_id: row.consultant_id,
            consultant_type: row.consultant_type,
            practitioner: row.practitioner || '',
            consultant_name: row.consultant_name || '',
            mobile: row.mobile || '',
            commission_type: row.commission_type,
            commission_value: String(row.commission_value ?? 0),
            is_active: Boolean(row.is_active),
            notes: row.notes || '',
        });
    };

    const saveConsultant = async () => {
        if (!clinicId) return;
        if (form.consultant_type === 'Internal' && !form.practitioner) {
            toast.error('Select a practitioner for internal consultants');
            return;
        }
        if (form.consultant_type === 'External' && !form.consultant_name.trim()) {
            toast.error('Consultant name is required');
            return;
        }

        try {
            setIsSaving(true);
            const saved = await clinicProfileService.saveClinicConsultant({
                clinic: clinicId,
                consultant_id: form.consultant_id,
                consultant_type: form.consultant_type,
                practitioner: form.consultant_type === 'Internal' ? form.practitioner : undefined,
                consultant_name: form.consultant_type === 'External' ? form.consultant_name.trim() : undefined,
                mobile: form.mobile || undefined,
                commission_type: form.commission_type,
                commission_value: Number(form.commission_value) || 0,
                is_active: form.is_active ? 1 : 0,
                notes: form.notes || undefined,
            });

            setRows((previous) => {
                const existingIndex = previous.findIndex((row) => row.consultant_id === saved.consultant_id);
                if (existingIndex >= 0) {
                    const next = [...previous];
                    next[existingIndex] = saved;
                    return next;
                }
                return [...previous, saved];
            });

            toast.success(editingId ? 'Consultant updated' : 'Consultant added');
            resetForm();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to save consultant');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteConsultant = async (consultantId: string) => {
        if (!clinicId) return;
        if (!window.confirm('Delete this consultant?')) return;

        try {
            setDeletingId(consultantId);
            await clinicProfileService.deleteClinicConsultant(clinicId, consultantId);
            setRows((previous) => previous.filter((row) => row.consultant_id !== consultantId));
            if (editingId === consultantId) {
                resetForm();
            }
            toast.success('Consultant deleted');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete consultant');
        } finally {
            setDeletingId(null);
        }
    };

    if (!isClinicAdmin) {
        return (
            <Card title="Consultants">
                <p className="text-sm text-gray-600">Only clinic admins can manage consultants.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Consultants</h3>
                        <p className="text-sm text-gray-500">Configure internal or external consultants and their default commission rules.</p>
                    </div>
                    {editingId && (
                        <Button variant="outline" onClick={resetForm}>
                            Cancel Edit
                        </Button>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Consultant Type</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                value={form.consultant_type}
                                onChange={(event) => patchForm({ consultant_type: event.target.value as 'Internal' | 'External', practitioner: '', consultant_name: '', mobile: '' })}
                            >
                                <option value="Internal">Internal</option>
                                <option value="External">External</option>
                            </select>
                        </div>
                        {form.consultant_type === 'Internal' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Practitioner</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    value={form.practitioner}
                                    onChange={(event) => applyPractitioner(event.target.value)}
                                >
                                    <option value="">Select practitioner</option>
                                    {practitioners.map((practitioner) => (
                                        <option key={practitioner.name} value={practitioner.name}>
                                            {practitioner.practitioner_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <InputField
                                label="Consultant Name"
                                value={form.consultant_name}
                                onChange={(event) => patchForm({ consultant_name: event.target.value })}
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField
                            label="Mobile"
                            value={form.mobile}
                            onChange={(event) => patchForm({ mobile: event.target.value })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Commission Type</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                value={form.commission_type}
                                onChange={(event) => patchForm({ commission_type: event.target.value as 'Percentage' | 'Fixed' })}
                            >
                                <option value="Percentage">Percentage</option>
                                <option value="Fixed">Fixed</option>
                            </select>
                        </div>
                        <InputField
                            label={form.commission_type === 'Percentage' ? 'Commission %' : 'Fixed Amount'}
                            type="number"
                            value={form.commission_value}
                            onChange={(event) => patchForm({ commission_value: event.target.value })}
                        />
                    </div>

                    <InputField
                        label="Notes"
                        value={form.notes}
                        onChange={(event) => patchForm({ notes: event.target.value })}
                    />

                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) => patchForm({ is_active: event.target.checked })}
                        />
                        Active consultant
                    </label>

                    <div className="flex justify-end">
                        <Button onClick={saveConsultant} isLoading={isSaving}>
                            {editingId ? 'Update Consultant' : 'Add Consultant'}
                        </Button>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Saved Consultants</h3>
                </div>

                {isLoading ? (
                    <p className="text-sm text-gray-600">Loading consultants...</p>
                ) : rows.length > 0 ? (
                    <div className="space-y-3">
                        {rows.map((row) => (
                            <div key={row.consultant_id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{row.consultant_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {row.consultant_type} {row.practitioner ? `• ${row.practitioner}` : ''}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {row.commission_type === 'Percentage'
                                                ? `${row.commission_value}% default commission`
                                                : `INR ${row.commission_value} fixed commission`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => editRow(row)}>
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => deleteConsultant(row.consultant_id)}
                                            isLoading={deletingId === row.consultant_id}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">No consultants configured for this clinic.</p>
                )}
            </Card>
        </div>
    );
};

export default ConsultantsSettingsTab;
