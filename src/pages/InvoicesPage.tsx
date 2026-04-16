import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, Card, Typography, Badge, Button, Flex, Stack, TopBar, BottomNav } from '../components';
import { paymentService } from '../api/services/payment';
import CreateInvoiceModal from '../components/invoices/CreateInvoiceModal';
import { InvoiceResponse } from '../api/types';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
import { generateInvoiceHTML } from '../utils/invoiceTemplates';
import { printHTML } from '../utils/printUtils';
import { useCreateInvoice } from '../hooks/usePayments';
import toast from 'react-hot-toast';
import {
    CurrencyDollarIcon,
    MagnifyingGlassIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

const InvoicesPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useClinic();
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [limitStart, setLimitStart] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const limitPageLength = 20;
    const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
    const { mutate: createInvoice, isPending: isCreatingInvoice } = useCreateInvoice();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');
        const incomingDateFrom = params.get('date_from');
        const incomingDateTo = params.get('date_to');
        const shouldOpenCreate = params.get('create') === '1';

        if (status) {
            setStatusFilter(status);
        }
        if (incomingDateFrom) {
            setDateFrom(incomingDateFrom);
        }
        if (incomingDateTo) {
            setDateTo(incomingDateTo);
        }
        if (shouldOpenCreate) {
            setShowCreateInvoiceModal(true);
        }
    }, [location.search]);

    const fetchInvoices = useCallback(async () => {
        try {
            setIsLoading(true);
            const filters: any = {};

            if (statusFilter !== 'all') {
                filters.status = statusFilter;
            }

            if (dateFrom) {
                filters.date_from = dateFrom;
            }
            if (dateTo) {
                filters.date_to = dateTo;
            }

            // Note: Backend might need specific filter keys for date range (e.g., from_date, to_date)
            // Assuming paymentService handles basic filters. If search requires specific patient search, 
            // we might need to search patients first or pass 'patient_name' if API supports it.
            // For now, client-side search filtering if API doesn't support generic search kw.

            const response = await paymentService.getInvoices(
                { limit_page_length: limitPageLength, limit_start: limitStart },
                filters
            );

            setInvoices(response.data || []);
            setTotalCount(response.total_count || 0);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
            toast.error('Could not load invoices');
        } finally {
            setIsLoading(false);
        }
    }, [dateFrom, dateTo, limitStart, statusFilter]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleViewInvoice = async (invoice: InvoiceResponse) => {
        try {
            const fullInvoice = await paymentService.getInvoice(invoice.name);
            const invoiceSettings = (profile?.invoice_settings || {}) as any;
            const templateId = invoiceSettings.template_id || 'modern';

            const invoiceHTML = generateInvoiceHTML(fullInvoice, profile, templateId, user?.name);


            printHTML(invoiceHTML);
        } catch (e) {
            toast.error('Failed to load invoice details');
        }
    };

    const handleCreateInvoiceSubmit = (data: any) => {
        if (!data.patient_id) {
            toast.error('Please select a patient');
            return;
        }

        const items = data.items || [];
        if (items.some((item: any) => !item.description || Number(item.rate) <= 0)) {
            toast.error('Please fill item description and rate');
            return;
        }

        createInvoice(
            {
                patient_id: data.patient_id,
                practitioner_id: data.practitioner_id || undefined,
                items: items.map(({ id, ...rest }: any) => ({
                    ...rest,
                    qty: Number(rest.qty) || 1,
                    rate: Number(rest.rate) || 0,
                })),
                posting_date: data.date,
                due_date: data.dueDate,
                remarks: data.notes || undefined,
                discount_amount: data.discount_amount || 0,
                tax_amount: data.tax_amount || 0,
            },
            {
                onSuccess: () => {
                    setShowCreateInvoiceModal(false);
                    fetchInvoices();
                    toast.success('Invoice created successfully');
                },
            }
        );
    };

    const filteredInvoices = invoices.filter(inv => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            inv.name.toLowerCase().includes(searchLower) ||
            inv.patient_name.toLowerCase().includes(searchLower) ||
            (inv.patient && inv.patient.toLowerCase().includes(searchLower))
        );
    });

    const handleCloseCreateInvoiceModal = () => {
        setShowCreateInvoiceModal(false);

        const params = new URLSearchParams(location.search);
        if (params.get('create') === '1') {
            params.delete('create');
            navigate(
                {
                    pathname: location.pathname,
                    search: params.toString() ? `?${params.toString()}` : '',
                },
                { replace: true }
            );
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 flex flex-col lg:pl-20">
                <TopBar title="All Invoices" showMenu />

                <div className="flex-1 overflow-y-auto pb-20 lg:pb-4">
                    <div className="app-content-shell px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-6">

                        {/* Header & Actions */}
                        <Flex justify="between" align="center" className="flex-wrap gap-4">
                            <div>
                                <Typography variant="h5" className="font-bold text-gray-900">Invoices</Typography>
                                <Typography variant="body2" className="text-gray-500">
                                    Manage patient billing and payments
                                </Typography>
                            </div>
                            <Button
                                onClick={() => setShowCreateInvoiceModal(true)}
                                leftIcon={<PlusIcon className="w-5 h-5" />}
                            >
                                New Invoice
                            </Button>
                        </Flex>

                        {/* Filters */}
                        <Card className="p-4 shadow-sm border border-gray-200">
                            <Stack spacing={4}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Search */}
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search invoice # or patient..."
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* Status Filter */}
                                    <select
                                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Overdue">Overdue</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>

                                    {/* Date From */}
                                    <input
                                        type="date"
                                        className="block w-full py-2 px-3 border border-gray-300 rounded-lg text-sm"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />

                                    {/* Date To */}
                                    <input
                                        type="date"
                                        className="block w-full py-2 px-3 border border-gray-300 rounded-lg text-sm"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </Stack>
                        </Card>

                        {/* Invoices List */}
                        {isLoading ? (
                            <Stack spacing={3}>
                                {[1, 2, 3, 4].map(i => (
                                    <Card key={i} className="animate-pulse h-24 bg-white"><div /></Card>
                                ))}
                            </Stack>
                        ) : filteredInvoices.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="min-w-full divide-y divide-gray-200">
                                    {filteredInvoices.map((inv) => (
                                        <div
                                            key={inv.name}
                                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                            onClick={() => handleViewInvoice(inv)}
                                        >
                                            <Flex justify="between" align="start" className="gap-4">
                                                <Flex gap={4} className="flex-1 min-w-0">
                                                    {/* Date Box */}
                                                    <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-gray-700 border border-gray-200 flex-shrink-0">
                                                        <span className="text-xs font-bold uppercase">{new Date(inv.posting_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                        <span className="text-lg font-bold">{new Date(inv.posting_date).getDate()}</span>
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Typography variant="h6" className="text-sm font-bold text-gray-900 truncate">
                                                                {inv.patient_name}
                                                            </Typography>
                                                            <span className="text-xs text-gray-400">•</span>
                                                            <Typography variant="caption" className="text-gray-500 font-mono">
                                                                {inv.name}
                                                            </Typography>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <CurrencyDollarIcon className="w-3.5 h-3.5" />
                                                                Total: ₹{inv.grand_total}
                                                            </span>
                                                            {inv.outstanding_amount > 0 && (
                                                                <span className="flex items-center gap-1 text-red-600 font-medium">
                                                                    Due: ₹{inv.outstanding_amount}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Flex>

                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge
                                                        variant={
                                                            inv.status === 'Paid' ? 'success' :
                                                                inv.status === 'Overdue' ? 'danger' :
                                                                    inv.status === 'Unpaid' ? 'warning' : 'gray'
                                                        }
                                                        size="sm"
                                                    >
                                                        {inv.status}
                                                    </Badge>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="hidden group-hover:flex text-primary-600"
                                                    >
                                                        View
                                                    </Button>
                                                </div>
                                            </Flex>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Footer */}
                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{limitStart + 1}</span> to <span className="font-medium">{Math.min(limitStart + limitPageLength, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={limitStart === 0}
                                                onClick={() => setLimitStart(Math.max(0, limitStart - limitPageLength))}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={limitStart + limitPageLength >= totalCount}
                                                onClick={() => setLimitStart(limitStart + limitPageLength)}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <CurrencyDollarIcon className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-900">No invoices found</h3>
                                <p className="mt-1 text-sm text-gray-500">Adjust your filters or create a new invoice.</p>
                                <div className="mt-6">
                                    <Button onClick={() => setShowCreateInvoiceModal(true)}>Create Invoice</Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                <CreateInvoiceModal
                    isOpen={showCreateInvoiceModal}
                    onClose={handleCloseCreateInvoiceModal}
                    onSubmit={handleCreateInvoiceSubmit}
                    isCreating={isCreatingInvoice}
                    allowPatientSelection
                />

                <BottomNav activeTab={activeTab} onTabChange={(tab: any) => {
                    setActiveTab(tab);
                    if (tab === 'appointments') navigate('/appointments');
                    // ... handle other tabs
                }} />
            </div>
        </div>
    );
};

export default InvoicesPage;
