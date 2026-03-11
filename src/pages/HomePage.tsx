import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Grid, Stack, Flex, Card, Button, Typography, Badge, Sidebar } from '../components';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import CreateInvoiceModal from '../components/invoices/CreateInvoiceModal';
import { useAppointmentsDashboard, useUpdateAppointment } from '../hooks/useAppointments';
import { usePatientStats, usePatientsForSelect } from '../hooks/usePatients';
import { useCreateInvoice } from '../hooks/usePayments';
import { ChevronRightIcon, CalendarIcon, UserIcon, MagnifyingGlassIcon, PlusIcon, UserGroupIcon, ClockIcon, CurrencyDollarIcon, CalendarDaysIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [openTypeMenuId, setOpenTypeMenuId] = useState<string | null>(null);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  // Real API data
  const {
    todaysAppointments,
    upcomingAppointments,
    todayCount,
    upcomingCount,
    pendingCount,
    confirmedCount,
    isLoading: appointmentsLoading,
  } = useAppointmentsDashboard();

  const { mutate: updateAppointment } = useUpdateAppointment();
  const { mutate: createInvoice, isPending: isCreatingInvoice } = useCreateInvoice();

  const {
    data: patientStats,
    isLoading: patientsLoading
  } = usePatientStats();

  // Search functionality
  const { data: searchResults, isLoading: isSearching } = usePatientsForSelect(
    searchQuery.length >= 2 ? searchQuery : undefined
  );

  const isLoading = appointmentsLoading || patientsLoading;

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'profile':
        navigate('/profile');
        break;
      case 'appointments':
        navigate('/appointments');
        break;
      case 'new-appointment':
        navigate('/appointments/new', { state: { backgroundLocation: location } });
        break;
      default:
        break;
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(query.length >= 2);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchResults(false);
      navigate(`/patients?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handlePatientClick = (patientId: string) => {
    setShowSearchResults(false);
    setSearchQuery('');
    navigate(`/prescriptions/${encodeURIComponent(patientId)}`);
  };

  const handleAppointmentTypeSelect = (appointmentId: string, type: 'Booking' | 'Walk In') => {
    updateAppointment({ appointment_id: appointmentId, appointment_type: type });
    setOpenTypeMenuId(null);
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

    createInvoice({
      patient_id: data.patient_id,
      practitioner_id: data.practitioner_id || undefined,
      items: items.map(({ id, ...rest }: any) => ({ ...rest, qty: Number(rest.qty) || 1, rate: Number(rest.rate) || 0 })),
      posting_date: data.date,
      due_date: data.dueDate,
      remarks: data.notes || undefined,
      discount_amount: data.discount_amount || 0,
      tax_amount: data.tax_amount || 0,
    }, {
      onSuccess: () => {
        setShowCreateInvoiceModal(false);
        toast.success('Invoice created successfully');
      }
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  // Filter appointments based on search query
  const filteredTodaysAppointments = searchQuery.length >= 2
    ? todaysAppointments.filter(apt =>
      apt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patient?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, loading, onClick }: any) => (
    <Card
      className={`h-full border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-primary-100' : ''}`}
      onClick={onClick}
    >
      <Flex align="start" justify="between" className="mb-2">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        {loading ? (
          <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
        ) : (
          <Typography variant="h3" className="font-bold text-gray-900">
            {value}
          </Typography>
        )}
      </Flex>
      <Stack spacing={1}>
        <Typography variant="body2" className="text-gray-600 font-medium">
          {title}
        </Typography>
        <Typography variant="caption" className="text-gray-400">
          {subtitle}
        </Typography>
      </Stack>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative lg:pl-20">
        <TopBar
          title="Dashboard"
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 lg:pb-4 flex-1" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">

            {/* Header Section */}
            <Flex align="center" justify="between" className="mb-2">
              <Stack spacing={1}>
                <Typography variant="h4" className="font-bold text-gray-900">
                  Welcome back, {user?.name || 'Doctor'}
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  Here's what's happening today at your clinic.
                </Typography>
              </Stack>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <Typography variant="body1" className="font-medium text-gray-900">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLogout}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  Logout
                </Button>
              </div>
            </Flex>

            {/* Quick Search */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-200 relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  className="block w-full pl-10 pr-3 py-3 border-none rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white bg-gray-50 transition-colors text-sm"
                  placeholder="Search for patients, appointments, or treatments..."
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                />
              </div>
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mx-auto"></div>
                      <span className="text-sm mt-2">Searching...</span>
                    </div>
                  ) : (
                    <>
                      {/* Matching Appointments */}
                      {filteredTodaysAppointments.length > 0 && (
                        <div>
                          <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">Today's Appointments</div>
                          {filteredTodaysAppointments.map((apt) => (
                            <div
                              key={apt.name || apt.appointment_id}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handlePatientClick(apt.patient || '')}
                            >
                              <div className="flex items-center gap-3">
                                <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{apt.patient_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(apt.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {apt.status}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Patient Search Results */}
                      {searchResults && searchResults.length > 0 && (
                        <div>
                          <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">Patients</div>
                          {searchResults.slice(0, 5).map((patient: any) => (
                            <div
                              key={patient.patient_id}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handlePatientClick(patient.patient_id)}
                            >
                              <div className="flex items-center gap-3">
                                <UserIcon className="w-5 h-5 text-green-500" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                                  <p className="text-xs text-gray-500">{patient.patient_id} • {patient.mobile}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* No Results */}
                      {filteredTodaysAppointments.length === 0 && (!searchResults || searchResults.length === 0) && (
                        <div className="p-4 text-center text-gray-500">
                          <p className="text-sm">No results found</p>
                          <p className="text-xs mt-1">Press Enter to search all patients</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Stats Overview */}
            <Grid cols={{ xs: 2, sm: 2, lg: 4 }} gap={4}>
              <StatCard
                title="Today's Appointments"
                value={todayCount}
                subtitle={`${confirmedCount} confirmed`}
                icon={CalendarDaysIcon}
                colorClass="bg-blue-500"
                loading={isLoading}
                onClick={() => navigate('/appointments')}
              />
              <StatCard
                title="Total Patients"
                value={patientStats?.totalPatients || 0}
                subtitle="Active records"
                icon={UserGroupIcon}
                colorClass="bg-green-500"
                loading={isLoading}
                onClick={() => navigate('/patients')}
              />
              <StatCard
                title="Upcoming"
                value={upcomingCount}
                subtitle="Next 7 days"
                icon={ClockIcon}
                colorClass="bg-purple-500"
                loading={isLoading}
                onClick={() => navigate('/appointments')}
              />
              <StatCard
                title="Pending"
                value={pendingCount}
                subtitle="Action required"
                icon={CurrencyDollarIcon}
                colorClass="bg-orange-500"
                loading={isLoading}
                onClick={() => navigate('/appointments')}
              />
            </Grid>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Schedule - Main Column */}
              <div className="lg:col-span-2 space-y-4">
                <Flex align="center" justify="between">
                  <Typography variant="h6" className="font-bold text-gray-900">
                    Today's Schedule
                  </Typography>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate('/appointments')}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    View Calendar <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </Flex>

                {isLoading ? (
                  <Stack spacing={3}>
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="animate-pulse h-20 bg-white">
                        <div />
                      </Card>
                    ))}
                  </Stack>
                ) : todaysAppointments.length > 0 ? (
                  <Stack spacing={3}>
                    {todaysAppointments.map((apt) => (
                      <Card
                        key={apt.name || apt.appointment_id}
                        className="group hover:ring-2 hover:ring-primary-100 transition-all cursor-pointer border border-gray-100 shadow-sm"
                        onClick={() => {
                          const pid = apt.patient || apt.patient_id || apt.patient_name;
                          if (pid) navigate(`/prescriptions/${encodeURIComponent(pid)}`);
                        }}
                      >
                        {(() => {
                          const appointmentId = (apt.name || apt.appointment_id || '') as string;
                          const displayType = (apt.appointment_type || 'Booking') as 'Booking' | 'Walk In';

                          return (
                        <Flex align="center" justify="between">
                          <Flex gap={4} align="center">
                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-50 rounded-lg text-gray-900 font-medium text-xs border border-gray-200">
                              <span>{new Date(apt.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}</span>
                              <span className="text-[10px] text-gray-500 uppercase">{new Date(apt.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}</span>
                            </div>
                            <Stack spacing={0.5}>
                              <Typography variant="body1" className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                {apt.patient_name}
                              </Typography>
                              <Flex align="center" gap={2} className="text-xs text-gray-500">
                                <span>Consultation</span>
                                <span>•</span>
                                <span>{apt.duration || 30} min</span>
                                <span>•</span>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenTypeMenuId(prev => (prev === appointmentId ? null : appointmentId));
                                    }}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                                  >
                                    {displayType}
                                  </button>
                                  {openTypeMenuId === appointmentId && (
                                    <div
                                      className="absolute z-10 mt-2 right-0 w-28 bg-white border border-gray-200 rounded-lg shadow-lg"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleAppointmentTypeSelect(appointmentId, 'Booking')}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                      >
                                        Booking
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAppointmentTypeSelect(appointmentId, 'Walk In')}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                      >
                                        Walk In
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </Flex>
                            </Stack>
                          </Flex>
                          <Badge
                            variant={
                              apt.status === 'Confirmed' ? 'success' :
                                apt.status === 'Scheduled' ? 'warning' :
                                  apt.status === 'Cancelled' ? 'danger' : 'primary'
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {apt.status}
                          </Badge>
                        </Flex>
                          );
                        })()}
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Card className="py-12 bg-gray-50 border-dashed border-2 border-gray-200 text-center">
                    <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <CalendarDaysIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <Typography variant="body1" className="text-gray-900 font-medium">No appointments today</Typography>
                    <Typography variant="body2" className="text-gray-500 mb-4">You're all caught up for the day!</Typography>
                    <Button
                      size="sm"
                      onClick={() => navigate('/appointments/new', { state: { backgroundLocation: location } })}
                      leftIcon={<PlusIcon className="w-4 h-4" />}
                    >
                      Schedule One
                    </Button>
                  </Card>
                )}
              </div>

              {/* Quick Actions & Upcoming - Side Column */}
              <div className="space-y-6">
                <div>
                  <Typography variant="h6" className="font-bold text-gray-900 mb-4">
                    Quick Actions
                  </Typography>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate('/appointments/new', { state: { backgroundLocation: location } })}
                      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                        <PlusIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">New Appointment</span>
                    </button>
                    <button
                      onClick={() => navigate('/patients/new')}
                      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all group"
                    >
                      <div className="p-2 bg-teal-50 text-teal-600 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                        <UserPlusIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">New Patient</span>
                    </button>
                    <button
                      onClick={() => navigate('/patients')}
                      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all group"
                    >
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Patients</span>
                    </button>
                    <button
                      onClick={() => setShowCreateInvoiceModal(true)}
                      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all group"
                    >
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                        <CurrencyDollarIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Invoice</span>
                    </button>
                    <button
                      onClick={() => navigate('/appointments')}
                      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all group"
                    >
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Calendar</span>
                    </button>
                  </div>
                </div>

                {upcomingAppointments.length > 0 && (
                  <div>
                    <Typography variant="h6" className="font-bold text-gray-900 mb-4">
                      Up Next
                    </Typography>
                    <Card className="border border-gray-100 shadow-sm divide-y divide-gray-100">
                      {upcomingAppointments.slice(0, 3).map((apt, i) => (
                        <div
                          key={apt.name || apt.appointment_id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            const pid = apt.patient || apt.patient_id || apt.patient_name;
                            if (pid) navigate(`/prescriptions/${encodeURIComponent(pid)}`);
                          }}
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {new Date(apt.appointment_datetime).getDate()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{apt.patient_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(apt.appointment_datetime).toLocaleDateString(undefined, { weekday: 'short' })}, {new Date(apt.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                        </div>
                      ))}
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        <CreateInvoiceModal
          isOpen={showCreateInvoiceModal}
          onClose={() => setShowCreateInvoiceModal(false)}
          appointment={undefined}
          onSubmit={handleCreateInvoiceSubmit}
          isCreating={isCreatingInvoice}
          allowPatientSelection
        />
      </div>
    </div>
  );
};

export default HomePage;
