import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Card, Container, Typography } from '../components';
import BottomNav from '../components/common/BottomNav';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';
import { clinicProfileService } from '../api/services/clinicProfile';
import { useClinic } from '../contexts/ClinicContext';
import { useOrthodonticConsultantReport, useOrthodonticDashboard } from '../hooks/useOrthodontic';
import { useQuery } from '@tanstack/react-query';

const money = (value?: number | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const displayDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : 'Not scheduled';

const StatCard: React.FC<{
  label: string;
  value: string;
  tone?: 'primary' | 'success' | 'warning' | 'gray';
}> = ({ label, value, tone = 'gray' }) => {
  const classes = {
    primary: 'bg-primary-50 border-primary-100 text-primary-700',
    success: 'bg-green-50 border-green-100 text-green-700',
    warning: 'bg-orange-50 border-orange-100 text-orange-700',
    gray: 'bg-white border-gray-200 text-gray-700',
  }[tone];

  return (
    <Card className={`p-5 border ${classes}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-80">{label}</div>
      <div className="mt-3 text-3xl font-extrabold tracking-tight">{value}</div>
    </Card>
  );
};

const OrthodonticDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [dateRange, setDateRange] = useState<'This Month' | 'This Week' | 'Today' | 'Custom'>('This Month');
  const [customFromDate, setCustomFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [customToDate, setCustomToDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedConsultantId, setSelectedConsultantId] = useState('');

  const dateParams = useMemo(() => {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];
    const start = new Date(today);

    if (dateRange === 'Today') {
      return { from_date: toDate, to_date: toDate, clinic: clinicId || undefined };
    }

    if (dateRange === 'This Week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      return {
        from_date: start.toISOString().split('T')[0],
        to_date: toDate,
        clinic: clinicId || undefined,
      };
    }

    if (dateRange === 'Custom') {
      return {
        from_date: customFromDate,
        to_date: customToDate,
        clinic: clinicId || undefined,
      };
    }

    start.setDate(1);
    return {
      from_date: start.toISOString().split('T')[0],
      to_date: toDate,
      clinic: clinicId || undefined,
    };
  }, [clinicId, customFromDate, customToDate, dateRange]);

  const { data, isLoading, error } = useOrthodonticDashboard(dateParams, Boolean(clinicId));
  const { data: consultantOptions = { consultants: [] } } = useQuery({
    queryKey: ['clinicConsultants', clinicId, 'orthodontic-dashboard'],
    queryFn: () => clinicProfileService.getClinicConsultants(clinicId || ''),
    enabled: Boolean(clinicId),
  });
  const { data: consultantReport, isLoading: consultantLoading } = useOrthodonticConsultantReport(
    {
      clinic: clinicId,
      consultant_id: selectedConsultantId || undefined,
    },
    Boolean(clinicId)
  );

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'appointments':
        navigate('/appointments');
        break;
      case 'new-appointment':
        navigate('/appointments/new');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        navigate('/home');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 lg:pl-20">
        <TopBar title="Orthodontics" showClinicSelector />

        <Container size="xl">
          <div className="py-6 pb-24 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Typography variant="h4" className="text-gray-900 font-extrabold tracking-tight mb-1">
                  Orthodontic Dashboard
                </Typography>
                <Typography variant="body2" className="text-gray-500 font-medium">
                  Active cases, balances, visit follow-up, and consultant payout visibility.
                </Typography>
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
                <select
                  value={dateRange}
                  onChange={(event) => setDateRange(event.target.value as typeof dateRange)}
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-800 outline-none"
                >
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Custom">Custom</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => navigate('/financial-dashboard')}>
                  Back To Financials
                </Button>
              </div>
            </div>

            {dateRange === 'Custom' && (
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  <span className="mb-1 block text-[11px] uppercase tracking-wider text-gray-400">From</span>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(event) => setCustomFromDate(event.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-300 px-3"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span className="mb-1 block text-[11px] uppercase tracking-wider text-gray-400">To</span>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(event) => setCustomToDate(event.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-300 px-3"
                  />
                </label>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-32 animate-pulse rounded-2xl bg-gray-200" />
                ))}
              </div>
            ) : error || !data ? (
              <Card className="p-8">
                <div className="text-center">
                  <div className="text-base font-semibold text-red-600">Failed to load orthodontic dashboard</div>
                  <div className="mt-2 text-sm text-gray-500">Please refresh and try again.</div>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Active Cases" value={String(data.summary.active_cases || 0)} tone="primary" />
                  <StatCard label="Outstanding" value={money(data.summary.total_outstanding)} tone="warning" />
                  <StatCard label="Collected" value={money(data.summary.collected_in_period)} tone="success" />
                  <StatCard label="New Cases" value={String(data.summary.new_cases_in_period || 0)} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card className="p-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">Due This Week</div>
                    <div className="mt-3 text-3xl font-extrabold text-gray-900">{data.summary.patients_due_this_week}</div>
                  </Card>
                  <Card className="p-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">Overdue Cases</div>
                    <div className="mt-3 text-3xl font-extrabold text-gray-900">{data.summary.overdue_cases}</div>
                  </Card>
                  <Card className="p-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">Commission Unpaid</div>
                    <div className="mt-3 text-3xl font-extrabold text-gray-900">{money(data.summary.commission_unpaid)}</div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <Card className="p-0 overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-4">
                      <div className="text-lg font-bold text-gray-900">Active Orthodontic Cases</div>
                      <div className="text-sm text-gray-500">Prioritize balances and upcoming follow-ups.</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {data.active_cases.length === 0 ? (
                        <div className="p-5 text-sm text-gray-500">No active orthodontic cases found.</div>
                      ) : (
                        data.active_cases.slice(0, 10).map((row) => (
                          <div key={row.name} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="text-base font-semibold text-gray-900">{row.patient_name}</div>
                              <div className="mt-1 text-sm text-gray-500">
                                {row.practitioner_name || 'Doctor not set'} · Next {displayDate(row.next_appointment_date)}
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                Last visit {displayDate(row.last_visit_date)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Balance</div>
                                <div className="text-lg font-bold text-orange-700">{money(row.balance_amount)}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/prescriptions/${encodeURIComponent(row.patient)}`)}
                              >
                                Open Patient
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  <Card className="p-0 overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-4">
                      <div className="text-lg font-bold text-gray-900">Consultant Commission</div>
                      <div className="mt-3">
                        <select
                          value={selectedConsultantId}
                          onChange={(event) => setSelectedConsultantId(event.target.value)}
                          className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none"
                        >
                          <option value="">All Consultants</option>
                          {consultantOptions.consultants.map((consultant) => (
                            <option key={consultant.consultant_id} value={consultant.consultant_id}>
                              {consultant.consultant_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="p-5">
                      {consultantLoading || !consultantReport ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((item) => (
                            <div key={item} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <StatCard label="Accrued" value={money(consultantReport.summary.total_commission_accrued)} />
                            <StatCard label="Paid" value={money(consultantReport.summary.total_commission_paid)} tone="success" />
                            <StatCard label="Pending" value={money(consultantReport.summary.total_pending_commission)} tone="warning" />
                          </div>

                          <div className="space-y-3">
                            {consultantReport.consultants.length === 0 ? (
                              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                No consultant commission records found.
                              </div>
                            ) : (
                              consultantReport.consultants.slice(0, 6).map((consultant) => (
                                <div
                                  key={consultant.consultant_id || consultant.consultant_name}
                                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900">
                                        {consultant.consultant_name || 'Unassigned'}
                                      </div>
                                      <div className="mt-1 text-xs text-gray-500">
                                        {consultant.case_count} cases · {consultant.ledger_count} ledger rows
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pending</div>
                                      <div className="text-base font-bold text-orange-700">
                                        {money(consultant.pending_commission)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card className="p-0 overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-4">
                      <div className="text-lg font-bold text-gray-900">Due This Week</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {data.due_this_week.length === 0 ? (
                        <div className="p-5 text-sm text-gray-500">No orthodontic follow-ups due this week.</div>
                      ) : (
                        data.due_this_week.slice(0, 8).map((row) => (
                          <div key={row.name} className="flex items-center justify-between gap-4 p-5">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{row.patient_name}</div>
                              <div className="mt-1 text-xs text-gray-500">{displayDate(row.next_appointment_date)}</div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/prescriptions/${encodeURIComponent(row.patient)}`)}>
                              Open
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  <Card className="p-0 overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-4">
                      <div className="text-lg font-bold text-gray-900">Overdue Cases</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {data.overdue_cases.length === 0 ? (
                        <div className="p-5 text-sm text-gray-500">No overdue orthodontic cases right now.</div>
                      ) : (
                        data.overdue_cases.slice(0, 8).map((row) => (
                          <div key={row.name} className="flex items-center justify-between gap-4 p-5">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{row.patient_name}</div>
                              <div className="mt-1 text-xs text-gray-500">
                                Next {displayDate(row.next_appointment_date)} · Balance {money(row.balance_amount)}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/prescriptions/${encodeURIComponent(row.patient)}`)}>
                              Open
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </Container>

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </main>
    </div>
  );
};

export default OrthodonticDashboardPage;
