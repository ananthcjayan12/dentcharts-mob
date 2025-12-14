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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Typography variant="h4" className="text-gray-900 font-bold">Financial Dashboard</Typography>
                            <Typography variant="body2" className="text-gray-500 mt-1">
                                Overview of your clinic's financial performance
                            </Typography>
                        </div>

                        {/* Date Filter */}
                        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                            {['Today', 'This Week', 'This Month', 'This Year'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === range
                                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
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
                            {/* KPI Cards */}
                            <Grid cols={{ xs: 1, sm: 2, lg: 4 }} gap={6}>
                                <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Today's Collection</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.summary.today_collection)}</h3>
                                        </div>
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <MoneyIcon />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <TrendingUpIcon />
                                        <span className="text-green-600 font-medium ml-1">{data.summary.today_growth}%</span>
                                        <span className="text-gray-400 ml-1">vs yesterday</span>
                                    </div>
                                </Card>

                                <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Month's Collection</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.summary.month_collection)}</h3>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded-lg">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <TrendingUpIcon />
                                        <span className="text-green-600 font-medium ml-1">{data.summary.month_growth}%</span>
                                        <span className="text-gray-400 ml-1">vs last month</span>
                                    </div>
                                </Card>

                                <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-orange-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Outstanding</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.summary.total_outstanding)}</h3>
                                        </div>
                                        <div className="p-2 bg-orange-50 rounded-lg">
                                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-gray-500">From {data.summary.total_patients} patients</span>
                                    </div>
                                </Card>

                                <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-teal-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total Patients</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{data.summary.total_patients}</h3>
                                        </div>
                                        <div className="p-2 bg-teal-50 rounded-lg">
                                            <UsersIcon />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm text-gray-500">
                                        <span className="font-medium text-teal-600">{data.summary.new_patients} New</span>
                                        <span className="mx-1">•</span>
                                        <span className="font-medium text-blue-600">{data.summary.returning_patients} Returning</span>
                                    </div>
                                </Card>
                            </Grid>

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
