import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';

// Dummy data for different time ranges
const rangeData = {
    today: {
        revenue: { current: 45750, previous: 38500 },
        appointments: { total: 12, completed: 8, cancelled: 1, noShow: 1, avgRevenue: 3800 },
        collections: { cash: 15750, card: 20000, upi: 10000, insurance: 0 },
        procedures: [
            { name: 'Cleaning', count: 5, revenue: 10000, avgPrice: 2000 },
            { name: 'Filling', count: 3, revenue: 9000, avgPrice: 3000 },
            { name: 'Root Canal', count: 1, revenue: 10000, avgPrice: 10000 },
        ],
        outstanding: { total: 12500, overdue: 4500, pending: 8000, collected: 45750 },
        label: "Today's Revenue"
    },
    week: {
        revenue: { current: 287500, previous: 265000 },
        appointments: { total: 45, completed: 38, cancelled: 4, noShow: 3, avgRevenue: 6388 },
        collections: { cash: 85000, card: 120000, upi: 65000, insurance: 17500 },
        procedures: [
            { name: 'Root Canal', count: 8, revenue: 80000, avgPrice: 10000 },
            { name: 'Cleaning', count: 15, revenue: 30000, avgPrice: 2000 },
            { name: 'Crown/Bridge', count: 4, revenue: 60000, avgPrice: 15000 },
        ],
        outstanding: { total: 45000, overdue: 15000, pending: 30000, collected: 287500 },
        label: "Weekly Revenue"
    },
    month: {
        revenue: { current: 1285000, previous: 1150000 },
        appointments: { total: 156, completed: 142, cancelled: 8, noShow: 6, avgRevenue: 8250 },
        collections: { cash: 520000, card: 380000, upi: 285000, insurance: 100000 },
        procedures: [
            { name: 'Root Canal', count: 45, revenue: 450000, avgPrice: 10000 },
            { name: 'Cleaning', count: 89, revenue: 178000, avgPrice: 2000 },
            { name: 'Crown/Bridge', count: 28, revenue: 420000, avgPrice: 15000 },
            { name: 'Orthodontics', count: 12, revenue: 480000, avgPrice: 40000 },
            { name: 'Extraction', count: 32, revenue: 96000, avgPrice: 3000 },
        ],
        outstanding: { total: 285000, overdue: 125000, pending: 160000, collected: 1000000 },
        label: "Monthly Revenue"
    },
    year: {
        revenue: { current: 15420000, previous: 12850000 },
        appointments: { total: 1845, completed: 1650, cancelled: 120, noShow: 75, avgRevenue: 8350 },
        collections: { cash: 6500000, card: 4800000, upi: 3120000, insurance: 1000000 },
        procedures: [
            { name: 'Orthodontics', count: 145, revenue: 5800000, avgPrice: 40000 },
            { name: 'Root Canal', count: 450, revenue: 4500000, avgPrice: 10000 },
            { name: 'Crown/Bridge', count: 280, revenue: 4200000, avgPrice: 15000 },
        ],
        outstanding: { total: 1250000, overdue: 450000, pending: 800000, collected: 15420000 },
        label: "Yearly Revenue"
    }
};

const financialData = {
    monthlyTrend: [
        { month: 'Jan', revenue: 980000, patients: 120, collections: 920000 },
        { month: 'Feb', revenue: 1050000, patients: 135, collections: 1010000 },
        { month: 'Mar', revenue: 1180000, patients: 148, collections: 1120000 },
        { month: 'Apr', revenue: 1020000, patients: 128, collections: 980000 },
        { month: 'May', revenue: 1250000, patients: 152, collections: 1200000 },
        { month: 'Jun', revenue: 1320000, patients: 165, collections: 1280000 },
        { month: 'Jul', revenue: 1150000, patients: 142, collections: 1100000 },
        { month: 'Aug', revenue: 1280000, patients: 158, collections: 1240000 },
        { month: 'Sep', revenue: 1350000, patients: 168, collections: 1300000 },
        { month: 'Oct', revenue: 1420000, patients: 175, collections: 1380000 },
        { month: 'Nov', revenue: 1285000, patients: 156, collections: 1250000 },
        { month: 'Dec', revenue: 0, patients: 0, collections: 0 },
    ],
    dailyTrend: [
        { day: 'Mon', revenue: 58000, patients: 24 },
        { day: 'Tue', revenue: 62000, patients: 28 },
        { day: 'Wed', revenue: 45000, patients: 22 },
        { day: 'Thu', revenue: 72000, patients: 32 },
        { day: 'Fri', revenue: 68000, patients: 30 },
        { day: 'Sat', revenue: 82000, patients: 38 },
        { day: 'Sun', revenue: 0, patients: 0 },
    ],
    topPatients: [
        { name: 'Rajesh Kumar', totalSpent: 185000, visits: 12 },
        { name: 'Priya Sharma', totalSpent: 145000, visits: 8 },
        { name: 'Mohammed Ali', totalSpent: 120000, visits: 15 },
        { name: 'Anjali Nair', totalSpent: 95000, visits: 6 },
        { name: 'Suresh Menon', totalSpent: 88000, visits: 10 },
    ],
};

// Calculate percentage change
const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

// Format currency
const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
};

// Format full currency
const formatFullCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

const FinancialDashboardPage: React.FC = () => {
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');

    // Get current data based on selection
    const currentData = rangeData[dateRange];

    // Calculate metrics
    const revenueChange = calcChange(currentData.revenue.current, currentData.revenue.previous);
    const collectionRate = (currentData.outstanding.collected / (currentData.outstanding.collected + currentData.outstanding.total)) * 100;

    // Determine displayed trend label
    const timeLabel = dateRange === 'today' ? "vs Yesterday" :
        dateRange === 'week' ? "vs Last Week" :
            dateRange === 'month' ? "vs Last Month" : "vs Last Year";

    // Chart max values
    const maxMonthlyRevenue = Math.max(...financialData.monthlyTrend.map(m => m.revenue));
    const maxDailyRevenue = Math.max(...financialData.dailyTrend.map(d => d.revenue));
    const maxProcedureRevenue = Math.max(...currentData.procedures.map(p => p.revenue));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Sidebar />
            <TopBar title="Financial Dashboard" />

            <div className="md:ml-64 pt-16 pb-24 md:pb-8 px-4 md:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                            Financial Dashboard
                        </h1>
                        <p className="text-gray-600 mt-1">Track revenue, collections & financial KPIs</p>
                    </div>
                    <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-gray-200 self-start md:self-auto overflow-x-auto max-w-full">
                        {(['today', 'week', 'month', 'year'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${dateRange === range
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Revenue Cards - Main Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                    {/* Total Revenue */}
                    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-semibold ${revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                <svg className={`w-4 h-4 ${revenueChange >= 0 ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                {Math.abs(revenueChange).toFixed(1)}%
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{formatCurrency(currentData.revenue.current)}</p>
                        <p className="text-xs text-gray-400 mt-2">{timeLabel}: {formatCurrency(currentData.revenue.previous)}</p>
                    </div>

                    {/* Total Collections */}
                    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Collections</p>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{formatCurrency(currentData.outstanding.collected)}</p>
                        <p className="text-xs text-gray-400 mt-2">Rate: {collectionRate.toFixed(1)}%</p>
                    </div>

                    {/* Total Appointments */}
                    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Appointments</p>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{currentData.appointments.total}</p>
                        <p className="text-xs text-gray-400 mt-2">{currentData.appointments.completed} Completed</p>
                    </div>

                    {/* Outstanding */}
                    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Outstanding</p>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{formatCurrency(currentData.outstanding.total)}</p>
                        <p className="text-xs text-gray-400 mt-2">Overdue: {formatCurrency(currentData.outstanding.overdue)}</p>
                    </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {/* Collection Rate */}
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-5 shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="font-medium text-cyan-100">Collection Rate</span>
                        </div>
                        <p className="text-3xl font-bold">{collectionRate.toFixed(1)}%</p>
                        <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                            <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${collectionRate}%` }}></div>
                        </div>
                    </div>

                    {/* Average Revenue per Visit */}
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="font-medium text-violet-100">Avg per Visit</span>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(currentData.appointments.avgRevenue)}</p>
                        <p className="text-sm text-violet-200 mt-2">Based on {currentData.appointments.completed} visits</p>
                    </div>

                    {/* Outstanding Amount */}
                    <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="font-medium text-rose-100">Outstanding</span>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(currentData.outstanding.total)}</p>
                        <p className="text-sm text-rose-200 mt-2">Overdue: {formatCurrency(currentData.outstanding.overdue)}</p>
                    </div>

                    {/* Appointment Conversion */}
                    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-5 shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="font-medium text-teal-100">Completion Rate</span>
                        </div>
                        <p className="text-3xl font-bold">{((currentData.appointments.completed / (currentData.appointments.total || 1)) * 100).toFixed(0)}%</p>
                        <p className="text-sm text-teal-200 mt-2">{currentData.appointments.completed}/{currentData.appointments.total} appointments</p>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Monthly Revenue Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Monthly Revenue Trend</h3>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-gray-600">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-gray-600">Collections</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-64 flex items-end gap-2">
                            {financialData.monthlyTrend.map((month) => (
                                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full flex gap-0.5 h-48 items-end">
                                        <div
                                            className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all hover:opacity-80"
                                            style={{ height: `${(month.revenue / maxMonthlyRevenue) * 100}%` }}
                                            title={`Revenue: ${formatFullCurrency(month.revenue)}`}
                                        ></div>
                                        <div
                                            className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all hover:opacity-80"
                                            style={{ height: `${(month.collections / maxMonthlyRevenue) * 100}%` }}
                                            title={`Collections: ${formatFullCurrency(month.collections)}`}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">{month.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Daily Revenue Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Daily Revenue (This Week)</h3>
                            <span className="text-sm text-gray-500">Total: {formatCurrency(financialData.dailyTrend.reduce((sum, d) => sum + d.revenue, 0))}</span>
                        </div>
                        <div className="h-64 flex items-end gap-4">
                            {financialData.dailyTrend.map((day) => (
                                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-gradient-to-t from-purple-600 via-purple-500 to-violet-400 rounded-t-lg transition-all hover:scale-105 cursor-pointer shadow-lg shadow-purple-200"
                                        style={{ height: `${maxDailyRevenue > 0 ? (day.revenue / maxDailyRevenue) * 192 : 0}px` }}
                                    >
                                        <div className="opacity-0 hover:opacity-100 transition-opacity p-2 text-center">
                                            <p className="text-xs text-white font-semibold">{formatCurrency(day.revenue)}</p>
                                            <p className="text-xs text-purple-200">{day.patients} patients</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-600 font-medium">{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment Modes & Procedures */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Payment Modes */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Collections by Payment Mode</h3>
                        <div className="space-y-4">
                            {Object.entries(currentData.collections).map(([mode, amount]) => {
                                const total = Object.values(currentData.collections).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? (amount / total) * 100 : 0;
                                const colors: Record<string, string> = {
                                    cash: 'from-emerald-500 to-green-600',
                                    card: 'from-blue-500 to-indigo-600',
                                    upi: 'from-purple-500 to-violet-600',
                                    insurance: 'from-amber-500 to-orange-600',
                                };
                                return (
                                    <div key={mode}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[mode]} flex items-center justify-center text-white font-bold text-sm`}>
                                                    {mode.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900 capitalize">{mode}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{formatCurrency(amount)}</p>
                                                <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className={`bg-gradient-to-r ${colors[mode]} rounded-full h-2 transition-all`} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top Procedures */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue by Procedure</h3>
                        <div className="space-y-3">
                            {currentData.procedures.map((proc) => {
                                const percentage = maxProcedureRevenue > 0 ? (proc.revenue / maxProcedureRevenue) * 100 : 0;
                                return (
                                    <div key={proc.name} className="group">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{proc.name}</span>
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{proc.count} cases</span>
                                            </div>
                                            <span className="font-bold text-gray-900">{formatCurrency(proc.revenue)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full h-2.5 transition-all group-hover:opacity-80"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Outstanding Breakdown */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Outstanding Breakdown</h3>
                        <div className="relative w-48 h-48 mx-auto mb-6">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                                <circle
                                    cx="50" cy="50" r="40" fill="none"
                                    stroke="url(#gradient1)" strokeWidth="12"
                                    strokeDasharray={`${(currentData.outstanding.overdue / currentData.outstanding.total) * 251} 251`}
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx="50" cy="50" r="40" fill="none"
                                    stroke="url(#gradient2)" strokeWidth="12"
                                    strokeDasharray={`${(currentData.outstanding.pending / currentData.outstanding.total) * 251} 251`}
                                    strokeDashoffset={`-${(currentData.outstanding.overdue / currentData.outstanding.total) * 251}`}
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="100%" stopColor="#f97316" />
                                    </linearGradient>
                                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#eab308" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentData.outstanding.total)}</p>
                                <p className="text-sm text-gray-500">Total</p>
                            </div>
                        </div>
                        <div className="flex justify-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500"></div>
                                <span className="text-sm text-gray-600">Overdue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"></div>
                                <span className="text-sm text-gray-600">Pending</span>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Stats */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Appointment Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-4 text-center border border-emerald-200">
                                <p className="text-3xl font-bold text-emerald-700">{currentData.appointments.completed}</p>
                                <p className="text-sm text-emerald-600 font-medium">Completed</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 text-center border border-blue-200">
                                <p className="text-3xl font-bold text-blue-700">{currentData.appointments.total}</p>
                                <p className="text-sm text-blue-600 font-medium">Total</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 text-center border border-amber-200">
                                <p className="text-3xl font-bold text-amber-700">{currentData.appointments.cancelled}</p>
                                <p className="text-sm text-amber-600 font-medium">Cancelled</p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 text-center border border-red-200">
                                <p className="text-3xl font-bold text-red-700">{currentData.appointments.noShow}</p>
                                <p className="text-sm text-red-600 font-medium">No Show</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Patients */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Top Patients by Revenue</h3>
                        <div className="space-y-3">
                            {financialData.topPatients.map((patient, idx) => (
                                <div key={patient.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                                        idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                            idx === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-700' :
                                                'bg-gradient-to-br from-blue-400 to-indigo-500'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                                        <p className="text-xs text-gray-500">{patient.visits} visits</p>
                                    </div>
                                    <p className="font-bold text-gray-900">{formatCurrency(patient.totalSpent)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboardPage;
