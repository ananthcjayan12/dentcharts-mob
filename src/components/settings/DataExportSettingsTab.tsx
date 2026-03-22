import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  dataExportService,
  DataExportConfig,
  ExportCsvPayload,
  ExportTypeKey,
} from '../../api/services/dataExport';

const fallbackDateFrom = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const fallbackDateTo = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const DataExportSettingsTab: React.FC = () => {
  const { user } = useAuth();
  const isClinicAdmin = Boolean(user?.permissions?.is_clinic_admin);
  const activeClinic = useMemo(() => user?.active_clinic || user?.primary_clinic || '', [user]);

  const [config, setConfig] = useState<DataExportConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    filename: string;
    row_count: number;
    generated_at: string;
    columns: string[];
  } | null>(null);

  const [exportType, setExportType] = useState<ExportTypeKey>('patient_statistics');
  const [dateFrom, setDateFrom] = useState<string>(fallbackDateFrom());
  const [dateTo, setDateTo] = useState<string>(fallbackDateTo());
  const [practitionerId, setPractitionerId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [includeSummary, setIncludeSummary] = useState<boolean>(true);
  const [lastSummary, setLastSummary] = useState<Record<string, string | number>>({});

  useEffect(() => {
    const loadConfig = async () => {
      if (!isClinicAdmin || !activeClinic) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await dataExportService.getConfig(activeClinic);
        setConfig(response);
        setDateFrom(response.default_date_from || fallbackDateFrom());
        setDateTo(response.default_date_to || fallbackDateTo());
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load data export configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [activeClinic, isClinicAdmin]);

  const selectedExportType = useMemo(
    () => config?.export_types?.find((row) => row.key === exportType),
    [config, exportType]
  );

  const statusOptions = selectedExportType?.status_options || ['All'];

  useEffect(() => {
    if (!statusOptions.includes(statusFilter)) {
      setStatusFilter('All');
    }
  }, [statusFilter, statusOptions]);

  const triggerDownload = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const onExport = async () => {
    if (!activeClinic) {
      toast.error('No active clinic selected');
      return;
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.error('From date cannot be after To date');
      return;
    }

    const payload: ExportCsvPayload = {
      export_type: exportType,
      clinic: activeClinic,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      practitioner: practitionerId !== 'all' ? practitionerId : undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      include_summary: includeSummary,
    };

    try {
      setIsExporting(true);
      const response = await dataExportService.exportCsv(payload);
      triggerDownload(response.filename, response.csv_content);
      setLastResult({
        filename: response.filename,
        row_count: response.row_count,
        generated_at: response.generated_at,
        columns: response.columns || [],
      });
      setLastSummary(response.summary || {});
      toast.success(`Export ready: ${response.row_count} rows`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate export');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isClinicAdmin) {
    return (
      <Card title="Data Export">
        <p className="text-sm text-gray-600">Only clinic admins can export clinic data.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card title="Data Export">
        <p className="text-sm text-gray-600">Loading export configuration...</p>
      </Card>
    );
  }

  if (!activeClinic) {
    return (
      <Card title="Data Export">
        <p className="text-sm text-gray-600">No active clinic selected.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-5 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Data Export</h3>
          <p className="text-sm text-gray-600 mt-1">
            Download analytics-ready CSV files for stakeholder reporting from clinic <span className="font-semibold">{activeClinic}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={exportType}
              onChange={(event) => setExportType(event.target.value as ExportTypeKey)}
            >
              {(config?.export_types || []).map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">{selectedExportType?.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Practitioner Scope</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={practitionerId}
              onChange={(event) => setPractitionerId(event.target.value)}
            >
              <option value="all">All Practitioners</option>
              {(config?.practitioners || []).map((row) => (
                <option key={row.practitioner_id} value={row.practitioner_id}>
                  {row.practitioner_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={includeSummary}
              onChange={(event) => setIncludeSummary(event.target.checked)}
            />
            Include summary section in CSV (totals, counts, outstanding)
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onExport} isLoading={isExporting}>
            Generate CSV Export
          </Button>
        </div>
      </Card>

      {lastResult && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Last Export</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Filename</p>
              <p className="font-medium text-gray-900 break-all">{lastResult.filename}</p>
            </div>
            <div>
              <p className="text-gray-500">Rows</p>
              <p className="font-medium text-gray-900">{lastResult.row_count}</p>
            </div>
            <div>
              <p className="text-gray-500">Generated At</p>
              <p className="font-medium text-gray-900">{lastResult.generated_at}</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Columns: {lastResult.columns.join(', ')}
          </div>
          {Object.keys(lastSummary).length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-sm font-semibold text-gray-800 mb-2">Summary</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(lastSummary).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-md px-3 py-2">
                    <p className="text-xs text-gray-500">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium text-gray-900">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default DataExportSettingsTab;
