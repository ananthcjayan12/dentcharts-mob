import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Card from '../common/Card';
import Button from '../common/Button';
import { authService } from '../../api/services/auth';
import { ClinicPractitionerPermission } from '../../api/types';
import { useAuth } from '../../contexts/AuthContext';

type PageOption = {
  key: string;
  label: string;
};

const PAGE_OPTIONS: PageOption[] = [
  { key: 'home', label: 'Home' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'patients', label: 'Patients' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'financial_dashboard', label: 'Financial Dashboard' },
  { key: 'settings', label: 'Settings' },
];

const RolesSettingsTab: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [clinic, setClinic] = useState<string>('');
  const [rows, setRows] = useState<ClinicPractitionerPermission[]>([]);
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});

  const activeClinic = useMemo(() => user?.active_clinic || user?.primary_clinic || '', [user]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!activeClinic) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const response = await authService.getClinicPractitionerPermissions(activeClinic);
        setClinic(response.clinic);
        setRows(response.practitioners || []);
      } catch (error: any) {
        console.error('Failed to load role settings', error);
        toast.error(error?.message || 'Failed to load role settings');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [activeClinic]);

  const updateRow = (practitionerId: string, updater: (row: ClinicPractitionerPermission) => ClinicPractitionerPermission) => {
    setRows((previous) => previous.map((row) => (row.practitioner_id === practitionerId ? updater(row) : row)));
  };

  const onToggleAdmin = (practitionerId: string, checked: boolean) => {
    updateRow(practitionerId, (row) => {
      const pages = checked
        ? Array.from(new Set([...row.allowed_pages, 'settings']))
        : row.allowed_pages.filter((page) => page !== 'settings');

      return {
        ...row,
        is_clinic_admin: checked,
        allowed_pages: pages,
      };
    });
  };

  const onTogglePage = (practitionerId: string, pageKey: string, checked: boolean) => {
    updateRow(practitionerId, (row) => {
      if (row.is_clinic_admin && pageKey === 'settings') {
        return row;
      }

      const nextPages = checked
        ? Array.from(new Set([...row.allowed_pages, pageKey]))
        : row.allowed_pages.filter((page) => page !== pageKey);

      return {
        ...row,
        allowed_pages: nextPages,
      };
    });
  };

  const saveRow = async (row: ClinicPractitionerPermission) => {
    if (!clinic) {
      toast.error('Clinic context is missing');
      return;
    }

    try {
      setSavingById((previous) => ({ ...previous, [row.practitioner_id]: true }));
      const updated = await authService.updatePractitionerPermissions({
        clinic,
        practitioner_id: row.practitioner_id,
        is_clinic_admin: row.is_clinic_admin,
        allowed_pages: row.allowed_pages,
      });

      updateRow(row.practitioner_id, (current) => ({
        ...current,
        is_clinic_admin: updated.is_clinic_admin,
        allowed_pages: updated.allowed_pages,
      }));

      toast.success('Permissions saved');

      const isCurrentUser = row.practitioner_id === user?.practitioner_id;
      const lostSettingsAccess = !updated.is_clinic_admin || !updated.allowed_pages.includes('settings');
      if (isCurrentUser && lostSettingsAccess) {
        toast.error('Your settings access changed. Please login again.');
        await logout();
        navigate('/login', { replace: true });
      }
    } catch (error: any) {
      console.error('Failed to update permissions', error);
      toast.error(error?.message || 'Failed to update permissions');
    } finally {
      setSavingById((previous) => ({ ...previous, [row.practitioner_id]: false }));
    }
  };

  if (!user?.permissions?.is_clinic_admin) {
    return (
      <Card title="🛡️ Roles Settings">
        <p className="text-sm text-gray-600">Only clinic admins can manage role access.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card title="🛡️ Roles Settings">
        <p className="text-sm text-gray-600">Loading role access settings...</p>
      </Card>
    );
  }

  if (!activeClinic) {
    return (
      <Card title="🛡️ Roles Settings">
        <p className="text-sm text-gray-600">No active clinic is selected for this account.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="🛡️ Roles Settings">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Manage page access for practitioners in <span className="font-semibold text-gray-800">{clinic || activeClinic}</span>.
          </p>
        </div>

        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.practitioner_id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{row.practitioner_name}</p>
                  <p className="text-xs text-gray-500">{row.practitioner_id}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={row.is_clinic_admin}
                    onChange={(event) => onToggleAdmin(row.practitioner_id, event.target.checked)}
                  />
                  Clinic Admin
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PAGE_OPTIONS.map((page) => {
                  const disabled = row.is_clinic_admin && page.key === 'settings';
                  const checked = row.allowed_pages.includes(page.key) || (row.is_clinic_admin && page.key === 'settings');

                  return (
                    <label key={page.key} className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={checked}
                        disabled={disabled}
                        onChange={(event) => onTogglePage(row.practitioner_id, page.key, event.target.checked)}
                      />
                      {page.label}
                    </label>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => saveRow(row)}
                  isLoading={Boolean(savingById[row.practitioner_id])}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <p className="text-sm text-gray-600">No practitioners found for the selected clinic.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RolesSettingsTab;
