import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Container, Typography, Grid, Button } from '../components'; // Keep existing components not explicitly moved
import {
    BanknotesIcon,
    CreditCardIcon,
    DocumentDuplicateIcon,
    ArrowTrendingUpIcon,
    CalendarIcon,
    FunnelIcon,
    ArrowPathIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';
import InputField from '../components/common/InputField';
import BottomNav from '../components/common/BottomNav';
import { useClinic } from '../contexts/ClinicContext';
import { useDashboardStats, useCollectionSummary } from '../hooks/useDashboard';

// --- Icons ---
const TrendingUpIcon = () => (
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
);

const MoneyIcon = () => (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const UsersIcon = () => (
    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);

// --- Custom Charts ---

// Simple Line Chart
const SimpleLineChart = ({ data, height = 200, color = "#3B82F6" }: { data: { date: string, amount: number }[], height?: number, color?: string }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">No data available</div>;

    const maxVal = Math.max(...data.map(d => d.amount));
    const minVal = Math.min(...data.map(d => d.amount));
    // Add padding to range
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        // Invert y (SVG 0 is top) and scale. Leave 10% padding top/bottom
        const y = 90 - ((d.amount - minVal) / range) * 80;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full relative" style={{ height }}>
            {/* Y-Axis labels (approx) */}
            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-gray-400">
                <span>{(maxVal / 1000).toFixed(1)}k</span>
                <span>{((minVal + range / 2) / 1000).toFixed(1)}k</span>
                <span>{(minVal / 1000).toFixed(1)}k</span>
            </div>

            {/* Chart Area */}
            <div className="absolute left-10 right-0 top-0 bottom-6">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="#f3f4f6" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#f3f4f6" strokeWidth="0.5" />
                    <line x1="0" y1="90" x2="100" y2="90" stroke="#f3f4f6" strokeWidth="0.5" />

                    {/* Line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Fill Gradient Area (optional, simple fill) */}
                    <polygon
                        points={`0,100 ${points} 100,100`}
                        fill={color}
                        fillOpacity="0.1"
                    />

                    {/* Points */}
                    {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 100;
                        const y = 90 - ((d.amount - minVal) / range) * 80;
                        return (
                            <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        )
                    })}
                </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between text-[10px] text-gray-400">
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
const DonutChart = ({ data, size = 160 }: { data: { mode: string, percentage: number, color?: string }[], size?: number }) => {
    let cumulativePercent = 0;
    // Assign colors if not present
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
            <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
                {chartData.map((slice, i) => {
                    const startPercent = cumulativePercent; // 0 to 1
                    const slicePercent = slice.percentage / 100;
                    cumulativePercent += slicePercent;
                    const endPercent = cumulativePercent;

                    const [startX, startY] = getCoordinatesForPercent(startPercent);
                    const [endX, endY] = getCoordinatesForPercent(endPercent);

                    // If it's a full circle (100%), draw a circle instead of an arc
                    if (slice.percentage >= 99.9) {
                        return <circle key={i} cx="0" cy="0" r="1" fill={slice.color} />;
                    }

                    // if slice is > 50%, take the long (large) arc
                    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                    const pathData = [
                        `M ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `L 0 0`,
                    ].join(' ');

                    return (
                        <path d={pathData} fill={slice.color} key={i} stroke="white" strokeWidth="0.05" />
                    );
                })}
                {/* Inner Circle for Donut Effect */}
                <circle cx="0" cy="0" r="0.6" fill="white" />
            </svg>
            {/* Center Text */}
            <div className="absolute text-center">
                <span className="block text-xs text-gray-500">Total</span>
                <span className="block text-lg font-bold text-gray-900">100%</span>
            </div>
        </div>
    );
};


const FinancialDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { clinicId } = useClinic();
    const [dateRange, setDateRange] = useState('This Month');

    const dateParams = useMemo(() => {
        const today = new Date();
        const to_date = today.toISOString().split('T')[0];
        let from_date = to_date;
        const d = new Date(); // copy

        if (dateRange === 'Today') {
            // Default from_date = to_date is correct
        } else if (dateRange === 'This Week') {
            // Start of week (Monday)
            const day = d.getDay(); // 0 (Sun) - 6 (Sat)
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
        return { from_date, to_date, clinic: clinicId || undefined };
    }, [dateRange, clinicId]);

    const { data: dashboardData, isLoading, error } = useDashboardStats(dateParams);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Fallback data structure if API fails or returns partial data to prevent crashes
    const data = dashboardData || {
        summary: {
            today_collection: 0, today_growth: 0,
            month_collection: 0, month_growth: 0,
            total_outstanding: 0, total_patients: 0,
            new_patients: 0, returning_patients: 0
        },
        revenue_trend: [],
        payment_modes: [],
        top_procedures: [],
        recent_transactions: []
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />

            <main className="flex-1 ml-0 md:ml-64 transition-all duration-300">
                <TopBar title="Dashboard" showClinicSelector={true} />

                <Container className="py-8 pb-24 space-y-8">

                    {/* Header */}
                    <div className="mb-6">
                        <Typography variant="h4" className="text-gray-900 font-bold">Financial Dashboard</Typography>
                        <Typography variant="body2" className="text-gray-500 mt-1">
                            Real-time overview of your clinic's financial performance
                        </Typography>
                    </div>

                    {isLoading ? (
                        <div className="h-96 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : error ? (
                        <div className="h-96 flex flex-col items-center justify-center text-red-500">
                            <p>Failed to load dashboard data.</p>
                            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
                        </div>
                    ) : (
                        <>
                            {/* KPI Cards - Fixed Time Periods */}
                            <Grid cols={{ xs: 1, sm: 2, lg: 3 }} gap={6}>
                                {/* Today's Collection */}
                                <Card className="hover:shadow-xl transition-all border-t-4 border-t-blue-500">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-sm font-semibold text-gray-600">TODAY'S COLLECTION</p>
                                            </div>
                                            <h3 className="text-4xl font-bold text-gray-900 mb-2">
                                                {formatCurrency(data.summary.today_collection)}
                                            </h3>
                                            {data.summary.today_invoiced !== undefined && (
                                                <div className="text-xs text-gray-500 mb-3">
                                                    of <span className="font-semibold text-gray-700">{formatCurrency(data.summary.today_invoiced)}</span> invoiced
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                                                {data.summary.today_growth >= 0 ? (
                                                    <>
                                                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                                                        <span className="text-green-600 font-semibold text-sm">{data.summary.today_growth}%</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                        </svg>
                                                        <span className="text-red-600 font-semibold text-sm">{Math.abs(data.summary.today_growth)}%</span>
                                                    </>
                                                )}
                                                <span className="text-gray-400 text-xs">vs yesterday</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                                            <BanknotesIcon className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </Card>

                                {/* This Month's Collection */}
                                <Card className="hover:shadow-xl transition-all border-t-4 border-t-purple-500">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-sm font-semibold text-gray-600">THIS MONTH</p>
                                            </div>
                                            <h3 className="text-4xl font-bold text-gray-900 mb-2">
                                                {formatCurrency(data.summary.month_collection)}
                                            </h3>
                                            {data.summary.collection_rate !== undefined && (
                                                <div className="mb-3">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-md">
                                                        <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="text-xs font-semibold text-purple-700">
                                                            {data.summary.collection_rate}% collected
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                                                {data.summary.month_growth >= 0 ? (
                                                    <>
                                                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                                                        <span className="text-green-600 font-semibold text-sm">{data.summary.month_growth}%</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                        </svg>
                                                        <span className="text-red-600 font-semibold text-sm">{Math.abs(data.summary.month_growth)}%</span>
                                                    </>
                                                )}
                                                <span className="text-gray-400 text-xs">vs last month</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </Card>

                                {/* Outstanding */}
                                <Card className="hover:shadow-xl transition-all border-t-4 border-t-orange-500">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-sm font-semibold text-gray-600">OUTSTANDING</p>
                                                {data.summary.outstanding_count > 0 && (
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                                        {data.summary.outstanding_count}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-4xl font-bold text-gray-900 mb-2">
                                                {formatCurrency(data.summary.total_outstanding)}
                                            </h3>
                                            {data.summary.aging_analysis && (
                                                <div className="flex gap-3 mb-3 text-xs">
                                                    <div>
                                                        <span className="text-gray-500">0-30d:</span>
                                                        <span className="font-semibold text-gray-700 ml-1">
                                                            ₹{(data.summary.aging_analysis["0_30_days"] / 1000).toFixed(0)}k
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">60+:</span>
                                                        <span className="font-semibold text-orange-700 ml-1">
                                                            ₹{(data.summary.aging_analysis["60_plus_days"] / 1000).toFixed(0)}k
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center pt-3 border-t border-gray-100">
                                                {data.summary.total_outstanding > 0 ? (
                                                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                        Needs follow-up
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        All clear!
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </Card>
                            </Grid>

                            {/* Patient Stats Row */}
                            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-600 mb-1">PATIENT STATS (THIS MONTH)</p>
                                            <div className="flex items-baseline gap-4">
                                                <div>
                                                    <span className="text-3xl font-bold text-gray-900">{data.summary.total_patients}</span>
                                                    <span className="text-sm text-gray-500 ml-2">total</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                                                        <span className="text-gray-700"><span className="font-semibold">{data.summary.new_patients}</span> new</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                                        <span className="text-gray-700"><span className="font-semibold">{data.summary.returning_patients}</span> returning</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {data.summary.total_patients > 0 && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 mb-1">Avg Revenue/Patient</p>
                                            <p className="text-2xl font-bold text-teal-700">
                                                {formatCurrency(data.summary.month_collection / data.summary.total_patients)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actionable Insights Section */}
                            {data.summary && (
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-3">Key Insights & Recommendations</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {/* Collection Rate Insight */}
                                                {data.summary.collection_rate !== undefined && data.summary.collection_rate < 80 && (
                                                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-orange-400">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-semibold text-orange-600">Low collection rate:</span> Only {data.summary.collection_rate}% of invoices collected
                                                        </p>
                                                        <button className="text-xs text-blue-600 hover:underline mt-1">Review pending invoices →</button>
                                                    </div>
                                                )}

                                                {/* Outstanding Aging Alert */}
                                                {data.summary.aging_analysis && data.summary.aging_analysis["60_plus_days"] > 0 && (
                                                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-red-400">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-semibold text-red-600">Overdue payments:</span> {formatCurrency(data.summary.aging_analysis["60_plus_days"])} pending 60+ days
                                                        </p>
                                                        <button className="text-xs text-blue-600 hover:underline mt-1">Send payment reminders →</button>
                                                    </div>
                                                )}

                                                {/* Growth Trend */}
                                                {(data.summary.period_growth || data.summary.month_growth) > 20 && (
                                                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-green-400">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-semibold text-green-600">Strong growth:</span> Revenue up {data.summary.period_growth || data.summary.month_growth}% vs last period
                                                        </p>
                                                        <button className="text-xs text-blue-600 hover:underline mt-1">View detailed trends →</button>
                                                    </div>
                                                )}

                                                {/* New Patient Acquisition */}
                                                {data.summary.total_patients > 0 && ((data.summary.new_patients / data.summary.total_patients) * 100) > 50 && (
                                                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-purple-400">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-semibold text-purple-600">High acquisition:</span> {Math.round((data.summary.new_patients / data.summary.total_patients) * 100)}% are new patients
                                                        </p>
                                                        <button className="text-xs text-blue-600 hover:underline mt-1">View patient analytics →</button>
                                                    </div>
                                                )}

                                                {/* Collection Success */}
                                                {data.summary.collection_rate !== undefined && data.summary.collection_rate >= 95 && (
                                                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-green-400">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-semibold text-green-600">Excellent collection:</span> {data.summary.collection_rate}% collection rate - keep it up!
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Charts Row 1 */}
                            <Grid cols={{ xs: 1, lg: 3 }} gap={6}>
                                {/* Revenue Trend - Takes 2 cols */}
                                <div className="lg:col-span-2">
                                    <Card title="Revenue Trend" className="h-full">
                                        <div className="p-2">
                                            <SimpleLineChart data={data.revenue_trend} height={250} />
                                        </div>
                                    </Card>
                                </div>

                                {/* Payment Modes - Takes 1 col */}
                                <div>
                                    <Card title="Payment Modes" className="h-full">
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <DonutChart data={data.payment_modes} />
                                            <div className="mt-6 w-full space-y-3">
                                                {data.payment_modes.map((item: any) => (
                                                    <div key={item.mode} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || '#ccc' }} />
                                                            <span className="text-gray-600">{item.mode}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                                                            <span className="text-gray-400 w-10 text-right">{item.percentage}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {data.payment_modes.length === 0 && <p className="text-center text-gray-400 text-sm">No payment data</p>}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </Grid>

                            {/* Charts Row 2 */}
                            <Grid cols={{ xs: 1, lg: 2 }} gap={6}>
                                {/* Top Procedures */}
                                <Card title="Top Procedures by Revenue">
                                    <div className="space-y-4">
                                        {data.top_procedures && data.top_procedures.length > 0 ? (
                                            data.top_procedures.map((proc: any, idx: number) => {
                                                const maxRevenue = Math.max(...data.top_procedures.map((p: any) => p.revenue));
                                                const widthPercent = (proc.revenue / maxRevenue) * 100;

                                                return (
                                                    <div key={proc.name}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-medium text-gray-700">{idx + 1}. {proc.name}</span>
                                                            <span className="font-bold text-gray-900">{formatCurrency(proc.revenue)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                            <div
                                                                className="bg-blue-600 h-2.5 rounded-full"
                                                                style={{ width: `${widthPercent}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1 text-right">
                                                            {proc.count} procedures performed
                                                        </div>
                                                    </div>
                                                );
                                            })) : (
                                            <p className="text-center text-gray-400 text-sm py-4">No procedure data found</p>
                                        )}
                                    </div>
                                </Card>

                                {/* Recent Transactions */}
                                <Card title="Recent Transactions">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="text-left text-xs font-semibold text-gray-500 py-2">Patient</th>
                                                    <th className="text-left text-xs font-semibold text-gray-500 py-2">Date</th>
                                                    <th className="text-left text-xs font-semibold text-gray-500 py-2">Mode</th>
                                                    <th className="text-right text-xs font-semibold text-gray-500 py-2">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {data.recent_transactions && data.recent_transactions.length > 0 ? (
                                                    data.recent_transactions.map((tx: any) => (
                                                        <tr key={tx.id} className="hover:bg-gray-50">
                                                            <td className="py-3 text-sm font-medium text-gray-900">{tx.patient_name}</td>
                                                            <td className="py-3 text-xs text-gray-500">{tx.date}</td>
                                                            <td className="py-3">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tx.mode === 'Cash' ? 'bg-blue-50 text-blue-700' :
                                                                    tx.mode === 'Card' ? 'bg-purple-50 text-purple-700' :
                                                                        'bg-green-50 text-green-700'
                                                                    }`}>
                                                                    {tx.mode}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(tx.amount)}</td>
                                                        </tr>
                                                    ))) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-4 text-center text-gray-500 text-sm">No recent transactions</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View All Transactions</Button>
                                    </div>
                                </Card>
                            </Grid>
                        </>
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
        </div>
    );
};

export default FinancialDashboardPage;
