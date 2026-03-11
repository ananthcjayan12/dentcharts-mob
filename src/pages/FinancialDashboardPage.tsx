import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Container, Typography, Button } from '../components';
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import { useClinic } from '../contexts/ClinicContext';
import { clinicProfileService } from '../api/services/clinicProfile';
import { paymentService } from '../api/services/payment';
import { useConsultantPayoutReport, useDashboardStats } from '../hooks/useDashboard';
import { usePractitioners } from '../hooks/usePractitioners';
import toast from 'react-hot-toast';

// --- Custom Charts ---

// Simple Line Chart
const SimpleLineChart = ({ data, height = 240, color = "#3B82F6" }: { data: { date: string, amount: number }[], height?: number, color?: string }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">No data available</div>;

    const maxVal = Math.max(...data.map(d => d.amount));
    const minVal = Math.min(...data.map(d => d.amount));
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 90 - ((d.amount - minVal) / range) * 80;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full relative" style={{ height }}>
            <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-[11px] font-medium text-gray-400">
                <span>{(maxVal / 1000).toFixed(1)}k</span>
                <span>{((minVal + range / 2) / 1000).toFixed(1)}k</span>
                <span>{(minVal / 1000).toFixed(1)}k</span>
            </div>

            <div className="absolute left-10 right-0 top-0 bottom-8">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <line x1="0" y1="10" x2="100" y2="10" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="0" y1="90" x2="100" y2="90" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="2,2" />

                    <defs>
                        <linearGradient id="gradientFill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    <polygon
                        points={`0,100 ${points} 100,100`}
                        fill="url(#gradientFill)"
                    />

                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 100;
                        const y = 90 - ((d.amount - minVal) / range) * 80;
                        return (
                            <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="hover:r-5 transition-all duration-200 cursor-pointer" />
                        )
                    })}
                </svg>
            </div>

            <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between text-[11px] font-medium text-gray-400">
                {data.length > 5 ? (
                    <>
                        <span>{data[0].date}</span>
                        <span>{data[Math.floor(data.length / 2)].date}</span>
                        <span>{data[data.length - 1].date}</span>
                    </>
                ) : (
                    data.map((d, i) => <span key={i}>{d.date}</span>)
                )}
            </div>
        </div>
    );
};

// Donut Chart
const DonutChart = ({ data, size = 180 }: { data: { mode: string, percentage: number, color?: string }[], size?: number }) => {
    let cumulativePercent = 0;
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

    const chartData = data.map((d, i) => ({
        ...d,
        color: d.color || colors[i % colors.length]
    }));

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    if (data.length === 0) {
        return (
            <div className="relative flex items-center justify-center rounded-full border-4 border-gray-100" style={{ width: size, height: size }}>
                <span className="text-gray-400 text-xs">No Data</span>
            </div>
        );
    }

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full drop-shadow-sm">
                {chartData.map((slice, i) => {
                    const startPercent = cumulativePercent; 
                    const slicePercent = slice.percentage / 100;
                    cumulativePercent += slicePercent;
                    const endPercent = cumulativePercent;

                    const [startX, startY] = getCoordinatesForPercent(startPercent);
                    const [endX, endY] = getCoordinatesForPercent(endPercent);

                    if (slice.percentage >= 99.9) {
                        return <circle key={i} cx="0" cy="0" r="1" fill={slice.color} />;
                    }

                    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                    const pathData = [
                        `M ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `L 0 0`,
                    ].join(' ');

                    return (
                        <path d={pathData} fill={slice.color} key={i} stroke="white" strokeWidth="0.08" className="hover:opacity-80 transition-opacity cursor-pointer" />
                    );
                })}
                <circle cx="0" cy="0" r="0.65" fill="white" />
            </svg>
            <div className="absolute text-center flex flex-col items-center justify-center">
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                <span className="block text-2xl font-black text-gray-800">100%</span>
            </div>
        </div>
    );
};


const FinancialDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { clinicId } = useClinic();
    const [dateRange, setDateRange] = useState('This Month');
    const [customFromDate, setCustomFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [customToDate, setCustomToDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedConsultantId, setSelectedConsultantId] = useState('');
    const [selectedPractitionerId, setSelectedPractitionerId] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);
    const { data: practitionersData } = usePractitioners();

    const dateParams = useMemo(() => {
        const today = new Date();
        const to_date = today.toISOString().split('T')[0];
        let from_date = to_date;
        const d = new Date(); 

        if (dateRange === 'Custom') {
            from_date = customFromDate || to_date;
            return {
                from_date,
                to_date: customToDate || to_date,
                clinic: clinicId || undefined,
                practitioner_id: selectedPractitionerId || undefined,
            };
        } else if (dateRange === 'Today') {
        } else if (dateRange === 'This Week') {
            const day = d.getDay(); 
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setDate(diff);
            from_date = d.toISOString().split('T')[0];
        } else if (dateRange === 'This Month') {
            d.setDate(1);
            from_date = d.toISOString().split('T')[0];
        } else if (dateRange === 'This Year') {
            d.setMonth(0, 1);
            from_date = d.toISOString().split('T')[0];
        }
        return {
            from_date,
            to_date,
            clinic: clinicId || undefined,
            practitioner_id: selectedPractitionerId || undefined,
        };
    }, [dateRange, customFromDate, customToDate, clinicId, selectedPractitionerId]);

    const { data: dashboardData, isLoading, error } = useDashboardStats(dateParams);
    const { data: consultantOptions = { consultants: [] } } = useQuery({
        queryKey: ['clinicConsultants', clinicId],
        queryFn: () => clinicProfileService.getClinicConsultants(clinicId || ''),
        enabled: Boolean(clinicId),
    });
    const { data: consultantPayoutData, isLoading: consultantPayoutLoading } = useConsultantPayoutReport({
        ...dateParams,
        consultant_id: selectedConsultantId || undefined,
    }, Boolean(clinicId));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const data = dashboardData || {
        summary: {
            today_collection: 0, today_growth: 0,
            month_collection: 0, month_growth: 0,
            total_outstanding: 0, total_patients: 0,
            new_patients: 0, returning_patients: 0,
            avg_transaction_value: 0,
            total_transactions: 0,
        },
        revenue_trend: [],
        payment_modes: [],
        top_procedures: [],
        recent_transactions: [],
        practitioner_revenue: [],
    };
    const payoutData = consultantPayoutData || {
        summary: {
            total_revenue: 0,
            total_collected: 0,
            total_commission: 0,
            consultant_count: 0,
            item_count: 0,
            invoice_count: 0,
        },
        consultants: [],
        rows: [],
    };
    const practitionerOptions = practitionersData?.data || [];
    const selectedPractitioner = practitionerOptions.find((item) => item.name === selectedPractitionerId);

    const buildInvoiceQuery = (extraParams: Record<string, string | undefined> = {}) => {
        const params = new URLSearchParams();
        params.set('date_from', dateParams.from_date);
        params.set('date_to', dateParams.to_date);
        Object.entries(extraParams).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });
        return `/invoices?${params.toString()}`;
    };

    const exportConsultantPayoutCsv = () => {
        const rows = consultantPayoutData?.rows || [];
        if (!rows.length) {
            toast.error('No consultant payout data to export');
            return;
        }

        const header = [
            'Date',
            'Invoice ID',
            'Patient ID',
            'Patient Name',
            'Consultant',
            'Procedure',
            'Total Invoiced',
            'Amount Received',
            'Commission Type',
            'Commission Value',
            'Commission Amount',
            'Commission Source',
            'Payment Status',
        ];
        const csvRows = rows.map((row: any) => ([
            row.date,
            row.invoice_id,
            row.patient,
            row.patient_name,
            row.consultant_name,
            row.procedure_name,
            row.total_invoiced,
            row.amount_received,
            row.commission_type,
            row.commission_value,
            row.commission_amount,
            row.commission_source,
            row.payment_status,
        ]));
        const csvContent = [header, ...csvRows]
            .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `consultant-payouts-${dateParams.from_date}-to-${dateParams.to_date}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const openTransactionDetail = async (invoiceId: string) => {
        try {
            setInvoiceDetailLoading(true);
            const invoice = await paymentService.getInvoice(invoiceId);
            setSelectedInvoice(invoice);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to load transaction details');
        } finally {
            setInvoiceDetailLoading(false);
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen text-gray-900 font-sans selection:bg-blue-100">
            <Sidebar />

            <main className="flex-1 ml-0 md:ml-64 transition-all duration-300">
                <TopBar title="Dashboard" showClinicSelector={true} />

                <Container className="max-w-[1400px] mx-auto py-8 pb-24 space-y-8">

                    {/* App-like Header & Filters */}
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-2">
                        <div>
                            <Typography variant="h4" className="text-gray-900 font-extrabold tracking-tight mb-1">Financial Dashboard</Typography>
                            <Typography variant="body2" className="text-gray-500 font-medium">
                                Clinic-wide financial overview & perfomance tracking.
                            </Typography>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 lg:gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200/60 ring-1 ring-black/[0.02]">
                            <div className="flex items-center px-4 py-2 bg-gray-50/80 rounded-[10px] text-sm text-gray-700 border border-gray-100/50">
                                <span className="text-gray-400 mr-2 text-[11px] font-bold uppercase tracking-wider">Scope</span>
                                <span className="font-semibold text-gray-800">{clinicId || 'Active clinic'}</span>
                            </div>
                            
                            <div className="w-px h-8 bg-gray-100 hidden sm:block"></div>
                            
                            <div className="flex items-center px-2">
                                <span className="text-gray-400 mr-2 text-[11px] font-bold uppercase tracking-wider hidden sm:inline-block">Provider</span>
                                <select
                                    value={selectedPractitionerId}
                                    onChange={(event) => setSelectedPractitionerId(event.target.value)}
                                    className="h-10 bg-transparent text-sm focus:ring-0 cursor-pointer outline-none font-semibold text-gray-800 pr-2"
                                >
                                    <option value="">All Practitioners</option>
                                    {practitionerOptions.map((practitioner) => (
                                        <option key={practitioner.name} value={practitioner.name}>
                                            {practitioner.practitioner_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="w-px h-8 bg-gray-100 hidden sm:block"></div>
                            
                            <div className="flex items-center px-2 pr-2">
                                <span className="text-gray-400 mr-2 text-[11px] font-bold uppercase tracking-wider hidden sm:inline-block">Period</span>
                                <select
                                    value={dateRange}
                                    onChange={(event) => setDateRange(event.target.value)}
                                    className="h-10 bg-transparent text-sm focus:ring-0 cursor-pointer outline-none font-semibold text-gray-800 pr-2"
                                >
                                    <option>Today</option>
                                    <option>This Week</option>
                                    <option>This Month</option>
                                    <option>This Year</option>
                                    <option>Custom</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {dateRange === 'Custom' && (
                        <div className="bg-white border border-gray-200/60 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                            <label className="flex-1 text-sm font-medium text-gray-700">
                                <span className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">From</span>
                                <input
                                    type="date"
                                    value={customFromDate}
                                    onChange={(event) => setCustomFromDate(event.target.value)}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-xl"
                                />
                            </label>
                            <label className="flex-1 text-sm font-medium text-gray-700">
                                <span className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">To</span>
                                <input
                                    type="date"
                                    value={customToDate}
                                    onChange={(event) => setCustomToDate(event.target.value)}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-xl"
                                />
                            </label>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="h-96 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-8 rounded-2xl flex flex-col items-center justify-center border border-red-100">
                            <p className="font-semibold mb-2">Failed to load dashboard data.</p>
                            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* Actionable Insights row - Contextual alerts at the top */}
                            {data.summary && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {data.summary.collection_rate !== undefined && data.summary.collection_rate < 80 && (
                                        <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100 flex gap-3 items-start hover:shadow-sm transition-shadow">
                                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Low Collection Rate</p>
                                                <p className="text-xs text-gray-600 mt-0.5">Only {data.summary.collection_rate}% collected.</p>
                                                <button className="text-xs font-semibold text-orange-700 mt-2 hover:underline" onClick={() => navigate(buildInvoiceQuery({ status: 'Unpaid' }))}>Review pending →</button>
                                            </div>
                                        </div>
                                    )}

                                    {data.summary.aging_analysis && data.summary.aging_analysis["60_plus_days"] > 0 && (
                                        <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 flex gap-3 items-start hover:shadow-sm transition-shadow">
                                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Overdue Payments</p>
                                                <p className="text-xs text-gray-600 mt-0.5">{formatCurrency(data.summary.aging_analysis["60_plus_days"])} pending 60+ days.</p>
                                                <button className="text-xs font-semibold text-red-700 mt-2 hover:underline" onClick={() => navigate(buildInvoiceQuery({ status: 'Overdue' }))}>Send reminders →</button>
                                            </div>
                                        </div>
                                    )}

                                    {(data.summary.period_growth || data.summary.month_growth) > 15 && (
                                        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex gap-3 items-start hover:shadow-sm transition-shadow">
                                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                                <ArrowTrendingUpIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Strong Growth</p>
                                                <p className="text-xs text-gray-600 mt-0.5">Revenue is up {data.summary.period_growth || data.summary.month_growth}%. Awesome job!</p>
                                            </div>
                                        </div>
                                    )}

                                    {data.summary.total_patients > 0 && ((data.summary.new_patients / data.summary.total_patients) * 100) > 40 && (
                                        <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 flex gap-3 items-start hover:shadow-sm transition-shadow">
                                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">High Acquisition</p>
                                                <p className="text-xs text-gray-600 mt-0.5">{Math.round((data.summary.new_patients / data.summary.total_patients) * 100)}% new patients.</p>
                                                <button className="text-xs font-semibold text-purple-700 mt-2 hover:underline" onClick={() => navigate('/patients')}>View analytics →</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MAIN KPI GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {/* Today */}
                                <Card className="p-6 rounded-[24px] border-none shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 w-28 h-28 bg-blue-50 rounded-full opacity-60 group-hover:scale-110 transition-transform pointer-events-none" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Today's Collection</p>
                                            <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">{formatCurrency(data.summary.today_collection)}</h3>
                                            
                                            <div className="flex items-center gap-1.5 mt-3">
                                                {data.summary.today_growth >= 0 ? (
                                                    <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-md text-xs font-bold">
                                                        <ArrowTrendingUpIcon className="w-3 h-3" /> {data.summary.today_growth}%
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-xs font-bold">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                                                        {Math.abs(data.summary.today_growth)}%
                                                    </span>
                                                )}
                                                <span className="text-gray-400 text-[11px] font-medium">vs yesterday</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-blue-50/80 rounded-2xl text-blue-600 ring-1 ring-blue-100">
                                            <BanknotesIcon className="w-6 h-6" />
                                        </div>
                                    </div>
                                </Card>

                                {/* Month */}
                                <Card className="p-6 rounded-[24px] border-none shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 w-28 h-28 bg-purple-50 rounded-full opacity-60 group-hover:scale-110 transition-transform pointer-events-none" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">This Month</p>
                                            <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">{formatCurrency(data.summary.month_collection)}</h3>
                                            
                                            <div className="flex items-center gap-1.5 mt-3">
                                                {data.summary.month_growth >= 0 ? (
                                                    <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-md text-xs font-bold">
                                                        <ArrowTrendingUpIcon className="w-3 h-3" /> {data.summary.month_growth}%
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-xs font-bold">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                                                        {Math.abs(data.summary.month_growth)}%
                                                    </span>
                                                )}
                                                <span className="text-gray-400 text-[11px] font-medium">vs last month</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-purple-50/80 rounded-2xl text-purple-600 ring-1 ring-purple-100">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    </div>
                                </Card>

                                {/* Outstanding */}
                                <Card className="p-6 rounded-[24px] border-none shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 w-28 h-28 bg-orange-50 rounded-full opacity-60 group-hover:scale-110 transition-transform pointer-events-none" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Outstanding</p>
                                                {data.summary.outstanding_count > 0 && (
                                                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">
                                                        {data.summary.outstanding_count} bills
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">{formatCurrency(data.summary.total_outstanding)}</h3>
                                            
                                            <div className="mt-3 flex items-center">
                                                {data.summary.total_outstanding > 0 ? (
                                                    <span className="text-[11px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        Needs Follow-up
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        Everything is clear
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-orange-50/80 rounded-2xl text-orange-600 ring-1 ring-orange-100">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </div>
                                </Card>

                                {/* Transactions */}
                                <Card className="p-6 rounded-[24px] border-none shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 w-28 h-28 bg-emerald-50 rounded-full opacity-60 group-hover:scale-110 transition-transform pointer-events-none" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Avg Txn Value</p>
                                            <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">{formatCurrency(data.summary.avg_transaction_value || 0)}</h3>
                                            <div className="mt-3 flex items-center text-[11px] text-gray-500 font-medium">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-bold mr-1.5">{data.summary.total_transactions || 0}</span> Total entries
                                            </div>
                                        </div>
                                        <div className="p-3 bg-emerald-50/80 rounded-2xl text-emerald-600 ring-1 ring-emerald-100">
                                            <CreditCardIcon className="w-6 h-6" />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* CHARTS ROW */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <Card className="p-6 rounded-[24px] border border-gray-100/50 shadow-sm bg-white h-full flex flex-col">
                                        <h4 className="text-sm font-bold text-gray-900 mb-6 tracking-wide">Revenue Trend</h4>
                                        <div className="flex-1">
                                            <SimpleLineChart data={data.revenue_trend} height={250} color="#3B82F6" />
                                        </div>
                                    </Card>
                                </div>
                                <div className="lg:col-span-1">
                                    <Card className="p-6 rounded-[24px] border border-gray-100/50 shadow-sm bg-white h-full flex flex-col">
                                        <h4 className="text-sm font-bold text-gray-900 mb-4 tracking-wide">Payments by Mode</h4>
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <DonutChart data={data.payment_modes} />
                                            <div className="mt-6 w-full space-y-3">
                                                {data.payment_modes.map((item: any) => (
                                                    <div key={item.mode} className="flex items-center justify-between text-sm group">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color || '#ccc' }} />
                                                            <span className="text-gray-600 font-medium transition-colors group-hover:text-gray-900">{item.mode}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                                                            <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded w-10 text-center">{item.percentage}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {data.payment_modes.length === 0 && <p className="text-center text-gray-400 text-sm font-medium">No payment data</p>}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* PATIENT & PROCEDURES REVENUE */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Patient Insights */}
                                <div className="lg:col-span-1">
                                    <Card className="p-6 rounded-[24px] border-none bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 shadow-sm h-full flex flex-col justify-between">
                                        <div>
                                            <div className="p-3 bg-white/60 rounded-xl w-max shadow-sm mb-4">
                                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            </div>
                                            <p className="text-[11px] font-bold text-indigo-500/80 uppercase tracking-widest mb-1">
                                                Patient Traffic ({selectedPractitioner ? 'Provider' : 'Clinic'})
                                            </p>
                                            <div className="flex items-end gap-2 mb-6">
                                                <span className="text-4xl font-extrabold text-gray-900 tracking-tight">{data.summary.total_patients}</span>
                                                <span className="text-sm font-medium text-gray-500 mb-1.5">total visited</span>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl border border-white/60">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></div>
                                                        <span className="text-sm font-semibold text-gray-700">New</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{data.summary.new_patients}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl border border-white/60">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm"></div>
                                                        <span className="text-sm font-semibold text-gray-700">Returning</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{data.summary.returning_patients}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {data.summary.total_patients > 0 && (
                                            <div className="mt-6 pt-4 border-t border-indigo-100/50">
                                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avg Value per Patient</p>
                                                <p className="text-xl font-bold text-indigo-900">
                                                    {formatCurrency(data.summary.month_collection / data.summary.total_patients)}
                                                </p>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                                
                                {/* Top Procedures */}
                                <div className="lg:col-span-2">
                                    <Card className="p-6 rounded-[24px] border border-gray-100/50 shadow-sm bg-white h-full">
                                        <h4 className="text-sm font-bold text-gray-900 mb-6 tracking-wide">Top Revenue Procedures</h4>
                                        <div className="space-y-5">
                                            {data.top_procedures && data.top_procedures.length > 0 ? (
                                                data.top_procedures.map((proc: any, idx: number) => {
                                                    const maxRevenue = Math.max(...data.top_procedures.map((p: any) => p.revenue));
                                                    const widthPercent = (proc.revenue / maxRevenue) * 100;

                                                    return (
                                                        <div key={proc.name} className="group">
                                                            <div className="flex justify-between text-sm mb-1.5">
                                                                <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                                                                    <span className="text-gray-400 mr-1.5">{idx + 1}.</span>{proc.name}
                                                                </span>
                                                                <span className="font-bold text-gray-900">{formatCurrency(proc.revenue)}</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                                <div
                                                                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                                                                    style={{ width: `${widthPercent}%` }}
                                                                />
                                                            </div>
                                                            <div className="text-[11px] font-medium text-gray-400 mt-1.5 text-right">
                                                                Performed {proc.count} times
                                                            </div>
                                                        </div>
                                                    );
                                                })) : (
                                                <div className="h-40 flex items-center justify-center text-center text-gray-400 text-sm font-medium">No procedure data found for this period</div>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* PRACTITIONER BREAKDOWN */}
                            <Card className="p-6 rounded-[24px] border border-gray-100/50 shadow-sm bg-white">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                                    <h4 className="text-sm font-bold text-gray-900 tracking-wide">Practitioner Performance</h4>
                                    {selectedPractitionerId && (
                                        <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors" onClick={() => setSelectedPractitionerId('')}>
                                            Clear filter
                                        </button>
                                    )}
                                </div>
                                <div className="block md:hidden space-y-4">
                                    {data.practitioner_revenue && data.practitioner_revenue.length > 0 ? (
                                        data.practitioner_revenue.map((row: any) => (
                                            <button
                                                key={`${row.practitioner_id || row.practitioner_name}-mobile`}
                                                className={`w-full text-left rounded-2xl border ${selectedPractitionerId === row.practitioner_id ? 'border-blue-400 bg-blue-50/30 ring-4 ring-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'} p-4 transition-all`}
                                                onClick={() => setSelectedPractitionerId(row.practitioner_id || '')}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{row.practitioner_name}</p>
                                                        <p className="text-xs font-medium text-gray-500 mt-1">{row.invoice_count} invoices • {row.patient_count} patients</p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded bg-gray-50 font-bold ${row.collection_rate >= 90 ? 'text-emerald-600' : row.collection_rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {row.collection_rate}% Coll.
                                                    </span>
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                                    <div className="rounded-xl bg-gray-50/80 p-2.5 border border-gray-100/50">
                                                        <p className="text-gray-500 font-medium mb-0.5">Invoiced</p>
                                                        <p className="font-bold text-gray-900">{formatCurrency(row.total_invoiced)}</p>
                                                    </div>
                                                    <div className="rounded-xl bg-gray-50/80 p-2.5 border border-gray-100/50">
                                                        <p className="text-gray-500 font-medium mb-0.5">Collected</p>
                                                        <p className="font-bold text-gray-900">{formatCurrency(row.total_collected)}</p>
                                                    </div>
                                                    <div className="rounded-xl bg-gray-50/80 p-2.5 border border-gray-100/50 col-span-2">
                                                        <p className="text-gray-500 font-medium mb-0.5">Commission Payout</p>
                                                        <p className="font-bold text-emerald-700">{formatCurrency(row.total_commission || 0)}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-sm font-medium text-gray-400">
                                            No performance data found for the selected config.
                                        </div>
                                    )}
                                </div>
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full min-w-[760px]">
                                        <thead>
                                            <tr className="border-b-2 border-gray-100">
                                                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest py-3 px-2">Practitioner</th>
                                                <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest py-3 px-2">Invoiced</th>
                                                <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest py-3 px-2">Collected</th>
                                                <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest py-3 px-2">Commission</th>
                                                <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest py-3 px-2">Outstanding</th>
                                                <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest py-3 px-2">Invoices</th>
                                                <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest py-3 px-2 w-[120px]">Coll. Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.practitioner_revenue && data.practitioner_revenue.length > 0 ? (
                                                data.practitioner_revenue.map((row: any) => {
                                                    const isSelected = selectedPractitionerId === row.practitioner_id;
                                                    return (
                                                    <tr
                                                        key={row.practitioner_id || row.practitioner_name}
                                                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/80'}`}
                                                        onClick={() => setSelectedPractitionerId(row.practitioner_id || '')}
                                                    >
                                                        <td className="py-4 px-2 text-sm font-bold text-gray-900 flex items-center gap-2">
                                                            {isSelected && <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>}
                                                            {row.practitioner_name}
                                                        </td>
                                                        <td className="py-4 px-2 text-sm font-semibold text-gray-700 text-right">{formatCurrency(row.total_invoiced)}</td>
                                                        <td className="py-4 px-2 text-sm font-bold text-gray-900 text-right">{formatCurrency(row.total_collected)}</td>
                                                        <td className="py-4 px-2 text-sm font-bold text-emerald-700 text-right">{formatCurrency(row.total_commission || 0)}</td>
                                                        <td className="py-4 px-2 text-sm font-semibold text-gray-600 text-right">{formatCurrency(row.outstanding_amount)}</td>
                                                        <td className="py-4 px-2 text-sm font-semibold text-gray-600 text-right">{row.invoice_count}</td>
                                                        <td className="py-4 px-2 text-sm text-right">
                                                            <div className="flex justify-end">
                                                                <span className={`px-2 py-1 rounded text-xs font-bold ${row.collection_rate >= 90 ? 'bg-emerald-50 text-emerald-700' : row.collection_rate >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                                                    {row.collection_rate}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )})
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="py-8 text-center text-sm font-medium text-gray-400">
                                                        No performance data available.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* CONSULTANT PAYOUT SECTION */}
                            <Card className="p-6 rounded-[24px] border border-gray-100/50 shadow-sm bg-white overflow-hidden">
                                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6 gap-4 border-b border-gray-100 pb-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 tracking-wide flex items-center gap-2">
                                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            Consultant Payout Summary
                                        </h4>
                                        <Typography variant="body2" className="text-gray-500 font-medium mt-1">
                                            Detailed reporting of generated commissions.
                                        </Typography>
                                    </div>
                                    <div className="w-full lg:w-auto flex items-center gap-3">
                                        <div className="flex-1 lg:w-64">
                                            <select
                                                value={selectedConsultantId}
                                                onChange={(event) => setSelectedConsultantId(event.target.value)}
                                                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                                            >
                                                <option value="">All Consultants</option>
                                                {(consultantOptions.consultants || []).map((consultant) => (
                                                    <option key={consultant.consultant_id} value={consultant.consultant_id}>
                                                        {consultant.consultant_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={exportConsultantPayoutCsv}>
                                            Export CSV
                                        </Button>
                                    </div>
                                </div>

                                {consultantPayoutLoading ? (
                                    <div className="h-32 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                                        {/* Payout Totals Box */}
                                        <div className="xl:col-span-1 border-r-0 xl:border-r border-gray-100 pr-0 xl:pr-6 flex flex-col gap-3">
                                            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
                                                <p className="text-[11px] font-bold text-purple-600/80 uppercase tracking-widest mb-1">Total Payout</p>
                                                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{formatCurrency(payoutData.summary.total_commission)}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Rev.</p>
                                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(payoutData.summary.total_revenue)}</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Coll.</p>
                                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(payoutData.summary.total_collected)}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-2 h-[260px] overflow-y-auto pr-2 space-y-2 no-scrollbar">
                                                {payoutData.consultants.length > 0 ? (
                                                    payoutData.consultants.map((consultant: any) => (
                                                        <button
                                                                key={consultant.consultant_id}
                                                                onClick={() => setSelectedConsultantId((current) => current === consultant.consultant_id ? '' : consultant.consultant_id)}
                                                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedConsultantId === consultant.consultant_id ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                                                            >
                                                                <p className="text-xs font-bold text-gray-900 mb-1">{consultant.consultant_name}</p>
                                                                <p className="text-sm font-extrabold text-emerald-600 mb-1">
                                                                    {formatCurrency(consultant.total_commission)}
                                                                </p>
                                                                <p className="text-[10px] font-medium text-gray-500">
                                                                    {consultant.invoice_count} bills
                                                                </p>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-xs font-medium text-gray-400 py-4">No consultants</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Payout Details */}
                                        <div className="xl:col-span-3">
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[700px]">
                                                    <thead className="bg-gray-50/80 rounded-xl">
                                                        <tr>
                                                            <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-2.5 rounded-l-xl">Date / Cons.</th>
                                                            <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-2.5">Detail</th>
                                                            <th className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-2.5">Rev/Coll</th>
                                                            <th className="text-right text-[10px] font-bold text-emerald-600 uppercase tracking-wider px-4 py-2.5 rounded-r-xl">Payout</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {payoutData.rows.length > 0 ? (
                                                            payoutData.rows.map((row: any) => (
                                                                <tr key={`${row.invoice_id}-${row.item_code}-${row.date}`} className="hover:bg-gray-50/50 transition-colors">
                                                                    <td className="px-4 py-3">
                                                                        <div className="text-[11px] font-semibold text-gray-500 mb-0.5">{row.date}</div>
                                                                        <div className="text-xs font-bold text-gray-900">{row.consultant_name}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="text-xs font-bold text-gray-800">{row.patient_name}</div>
                                                                        <div className="text-[11px] font-medium text-gray-500">{row.procedure_name}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <div className="text-xs font-semibold text-gray-700">{formatCurrency(row.total_invoiced)}</div>
                                                                        <div className="text-[11px] font-medium text-gray-500">rx: {formatCurrency(row.amount_received)}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <div className="text-sm font-extrabold text-emerald-600">{formatCurrency(row.commission_amount)}</div>
                                                                        <div className={`text-[10px] font-bold uppercase ${row.payment_status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                            {row.payment_status}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={4} className="px-4 py-12 text-center text-sm font-medium text-gray-400">
                                                                    No payout records found.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* RECENT TRANSACTIONS */}
                            <Card className="p-6 rounded-[24px] border border-gray-100/50 shadow-sm bg-white">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-sm font-bold text-gray-900 tracking-wide">Recent Transactions</h4>
                                    <Button variant="ghost" size="sm" className="text-blue-600 text-xs font-bold hover:bg-blue-50" onClick={() => navigate(buildInvoiceQuery())}>
                                        View All →
                                    </Button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[500px]">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest pb-3">Patient</th>
                                                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest pb-3">Date</th>
                                                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest pb-3">Mode</th>
                                                <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest pb-3">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.recent_transactions && data.recent_transactions.length > 0 ? (
                                                data.recent_transactions.map((tx: any) => (
                                                    <tr key={`${tx.payment_entry_id || tx.id}-${tx.invoice_id || ''}`} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => openTransactionDetail(tx.invoice_id || tx.id)}>
                                                        <td className="py-3.5 text-sm font-bold text-gray-800">{tx.patient_name}</td>
                                                        <td className="py-3.5 text-xs font-medium text-gray-500">{tx.date}</td>
                                                        <td className="py-3.5">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${tx.mode === 'Cash' ? 'bg-blue-50 text-blue-700' :
                                                                tx.mode === 'Card' ? 'bg-purple-50 text-purple-700' :
                                                                    'bg-emerald-50 text-emerald-700'
                                                                }`}>
                                                                {tx.mode}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 text-sm font-extrabold text-gray-900 text-right">{formatCurrency(tx.amount)}</td>
                                                    </tr>
                                                ))) : (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-sm font-medium text-gray-400">No recent transactions</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                        </div>
                    )}
                </Container>
            </main>

            <BottomNav
                activeTab={'home' as any}
                onTabChange={(tab) => {
                    if (tab === 'home') navigate('/home');
                    if (tab === 'appointments') navigate('/appointments');
                    if (tab === 'new-appointment') navigate('/appointments/new');
                    if (tab === 'profile') navigate('/profile');
                }}
            />

            {/* Invoice Detail Modal */}
            {(selectedInvoice || invoiceDetailLoading) && (
                <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-opacity">
                    <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden ring-1 ring-black/5 transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-900">Transaction Detail</h3>
                                <p className="text-xs font-medium text-gray-500">{selectedInvoice?.name || selectedInvoice?.invoice_id || 'Loading invoice...'}</p>
                            </div>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shadow-sm border border-gray-200" onClick={() => setSelectedInvoice(null)}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 max-h-[75vh] overflow-y-auto">
                            {invoiceDetailLoading || !selectedInvoice ? (
                                <div className="h-40 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient</p>
                                            <p className="mt-1 text-sm font-bold text-gray-900">{selectedInvoice.patient?.patient_name || selectedInvoice.patient_name}</p>
                                        </div>
                                        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total / Balance</p>
                                            <p className="mt-1 text-sm font-bold text-gray-900">
                                                {formatCurrency(selectedInvoice.grand_total)} <span className="text-gray-400 font-medium">/</span> <span className={selectedInvoice.outstanding_amount > 0 ? 'text-red-500' : 'text-emerald-500'}>{formatCurrency(selectedInvoice.outstanding_amount)}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 mb-3 tracking-wider uppercase">Items</h4>
                                        <div className="space-y-2">
                                            {(selectedInvoice.items || []).map((item: any, index: number) => (
                                                <div key={`${item.item_code || item.description}-${index}`} className="group rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800">{item.description || item.item_code}</p>
                                                            <p className="text-xs font-medium text-gray-500 mt-0.5">Qty {item.qty} • Rate {formatCurrency(item.rate || 0)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-extrabold text-gray-900">{formatCurrency((item.qty || 0) * (item.rate || 0))}</p>
                                                            {item.consultant_name && (
                                                                <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 inline-block px-1.5 py-0.5 rounded mt-1">
                                                                    {item.consultant_name} (+{formatCurrency(item.consultant_commission_amount || 0)})
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialDashboardPage;
