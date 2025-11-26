import React, { useState } from 'react';
import { findNextAvailableSlotTime, normalizeToHHMMSS } from '../utils/slotUtils';
import { useNavigate } from 'react-router-dom';
import { Container, Stack, Card, Typography, Badge, Avatar, Flex, InputField, Sidebar, Button, AppointmentActions } from '../components';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import { 
  useAppointments, 
  useUpdateAppointment, 
  useCancelAppointment, 
  useDeleteAppointment, 
  useAddToTodaysQueue, 
  useAvailableSlots,
  useCheckInAppointment,
  useStartVisit,
  useCompleteVisit,
  useUpdateReviewStatus
} from '../hooks/useAppointments';
import { usePractitioners } from '../hooks/usePractitioners';
import { usePatients, usePatientsWithSearch } from '../hooks/usePatients';
import { Appointment } from '../types';
import toast from 'react-hot-toast';

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('appointments');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  // Toggle to show only today's queue (default ON)
  const [showTodaysOnly, setShowTodaysOnly] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddToQueueModal, setShowAddToQueueModal] = useState(false);
  const [selectedPatientForQueue, setSelectedPatientForQueue] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [overrideQueueTime, setOverrideQueueTime] = useState('');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [practitionerFilter, setPractitionerFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const { mutate: updateAppointment, isPending: isUpdating } = useUpdateAppointment();
  const { mutate: cancelAppointment, isPending: isCancelling } = useCancelAppointment();
  const { mutate: deleteAppointment, isPending: isDeleting } = useDeleteAppointment();
  const { mutate: addToQueue, isPending: isAddingToQueue } = useAddToTodaysQueue();
  
  // New status-based action hooks
  const { mutate: checkInAppointment } = useCheckInAppointment();
  const { mutate: startVisit } = useStartVisit();
  const { mutate: completeVisit } = useCompleteVisit();
  const { mutate: updateReviewStatus } = useUpdateReviewStatus();

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigate('/home');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'new-appointment':
        navigate('/appointments/new');
        break;
      default:
        break;
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    // Use patient (Frappe ID), fallback to patient_name
    const patientIdentifier = appointment.patient || appointment.patient_name;
    if (patientIdentifier) {
      navigate(`/prescriptions/${encodeURIComponent(patientIdentifier)}`);
    } else {
      console.error('No patient identifier found for appointment:', appointment);
    }
  };

  const handleEditAppointment = (appointment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const appointmentTime = new Date(appointment.appointment_datetime);
    setEditingAppointment({
      appointment_id: appointment.name || appointment.appointment_id,
      patient_name: appointment.patient_name,
      appointment_date: appointmentTime.toISOString().split('T')[0],
      appointment_time: appointmentTime.toTimeString().split(' ')[0].substring(0, 5),
      notes: appointment.notes || '',
      appointment_type: appointment.appointment_type || 'General Consultation',
      practitioner: appointment.practitioner,
    });
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    const type = editingAppointment.appointment_type || 'Consultation';
    updateAppointment({
      appointment_id: editingAppointment.appointment_id,
      appointment_time: editingAppointment.appointment_time + ':00',
      notes: editingAppointment.notes,
      appointment_type: type,
      type: type,
      practitioner: editingAppointment.practitioner,
      appointment_for: 'Practitioner',
    }, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingAppointment(null);
      }
    });
  };

  const handleCancelAppointment = async (appointmentId: string, appointment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    const type = appointment.appointment_type || 'Consultation';
    cancelAppointment({
      appointment_id: appointmentId,
      reason: 'Cancelled by doctor',
      appointment_type: type,
      type: type,
      practitioner: appointment.practitioner,
      appointment_for: 'Practitioner',
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
  };

  const handleDeleteAppointment = async (appointmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return;
    }

    deleteAppointment(appointmentId);
  };

  const handleAddToTodaysQueue = async () => {
    if (!selectedPatientForQueue) {
      toast.error('Please select a patient');
      return;
    }

    try {
      // Ensure we have the latest slots for the selected practitioner before computing
      let freshSlots = todaysSlots;
      if (refetchTodaysSlots) {
        try {
          const refetchResult = await refetchTodaysSlots();
          freshSlots = refetchResult?.data || todaysSlots;
        } catch (e) {
          // ignore refetch errors and fall back to whatever slots we have
          freshSlots = todaysSlots;
        }
      }

      // If user provided an explicit time override, check occupancy and include it in the payload
      const payload: any = {
        patient_id: selectedPatientForQueue,
        duration: 30,
        appointment_type: 'Consultation',
        type: 'Consultation',
        appointment_for: 'Practitioner',
      };

      if (overrideQueueTime) {
        // Attempt to find matching slot for occupancy info (slots have `time` like '09:30')
        const matched = freshSlots.find((s: any) => s.time === overrideQueueTime || s.time?.startsWith(overrideQueueTime));
        if (matched && typeof matched.existing_appointments !== 'undefined' && matched.existing_appointments > 0) {
          const ok = window.confirm(`This slot already has ${matched.existing_appointments} booking(s). Do you want to continue and add to this slot?`);
          if (!ok) return;
        }

        // Normalize overrideQueueTime to HH:MM:SS
        const normalized = normalizeToHHMMSS(overrideQueueTime);
        if (normalized) payload.appointment_time = normalized;
      }

      // If no override provided, pick the next slot after current time (DRY: use helper)
      if (!payload.appointment_time) {
        const next = findNextAvailableSlotTime(freshSlots, new Date());
        if (next) {
          const normalized = normalizeToHHMMSS(next);
          if (normalized) payload.appointment_time = normalized;
        } else {
          toast.error('No available slots found for today.');
          return;
        }
      }

      if (!payload.appointment_time) {
        toast.error('Unable to determine appointment time.');
        return;
      }

      // Debug payload + slots to help trace why server might default to 09:00
      // eslint-disable-next-line no-console
      console.debug('AddToQueue - freshSlots:', freshSlots, 'payload:', payload);

      // @ts-ignore - Extra fields for backend compatibility
      await addToQueue(payload);
      setShowAddToQueueModal(false);
      setSelectedPatientForQueue('');
      setPatientSearch('');
      setOverrideQueueTime('');
    } catch (error: any) {
      console.error('Add to queue error:', error);
    }
  };

  // New status-based action handlers
  const handleCheckIn = (appointmentId: string) => {
    checkInAppointment(appointmentId);
  };

  const handleStartVisit = (appointmentId: string) => {
    startVisit(appointmentId);
  };

  const handleCompleteVisit = (appointmentId: string) => {
    completeVisit(appointmentId);
  };

  const handleUploadFiles = (appointmentId: string) => {
    // Navigate to file upload page or open modal
    toast('File upload feature - Coming soon!', { icon: 'ℹ️' });
    // TODO: Implement file upload navigation
  };

  const handleToggleReview = (appointmentId: string, requested: boolean) => {
    updateReviewStatus({ appointmentId, requested });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Build dynamic filters
  const appointmentFilters: any = {};
  // If "Today's Queue" toggle is enabled, override date filters to today
  const today = new Date().toISOString().split('T')[0];
  if (showTodaysOnly) {
    appointmentFilters.date_from = today;
    appointmentFilters.date_to = today;
  } else {
    if (dateFrom) appointmentFilters.date_from = dateFrom;
    if (dateTo) appointmentFilters.date_to = dateTo;
  }
  if (statusFilter && statusFilter !== 'all') appointmentFilters.status = statusFilter;
  if (practitionerFilter && practitionerFilter !== 'all') appointmentFilters.practitioner = practitionerFilter;

  // Fetch practitioners for filter dropdown
  const { data: practitionersData } = usePractitioners();
  const practitioners = practitionersData?.data || [];

  // Practitioner selected for Add-to-Queue flow
  const [selectedPractitionerForQueue, setSelectedPractitionerForQueue] = useState<string>(practitionerFilter !== 'all' ? practitionerFilter : '');

  // Set default practitioner for queue when practitioners load
  React.useEffect(() => {
    if (!selectedPractitionerForQueue && practitioners.length > 0) {
      setSelectedPractitionerForQueue(practitioners[0].name);
    }
  }, [practitioners, selectedPractitionerForQueue]);

  // Today's date for queue operations
  const todayDate = new Date().toISOString().split('T')[0];

  // Fetch today's slots when add-to-queue modal is open (used to show occupancy)
  const todaysSlotsParams: any = { date: todayDate, duration: 30 };
  if (selectedPractitionerForQueue) todaysSlotsParams.practitioner = selectedPractitionerForQueue;
  const { data: todaysSlotsData, isLoading: todaysSlotsLoading, refetch: refetchTodaysSlots } = useAvailableSlots(
    todaysSlotsParams,
    showAddToQueueModal && !!selectedPractitionerForQueue
  );
  const todaysSlots = todaysSlotsData || [];

  const { data: patientsData } = usePatientsWithSearch(patientSearch, { limit_page_length: 20 });
  const patientsList = patientsData?.data || [];

  

  // Real API data with pagination and filters
  const { 
    data: appointmentsData, 
    isLoading: appointmentsLoading 
  } = useAppointments(
    { 
      limit_page_length: itemsPerPage, 
      limit_start: (currentPage - 1) * itemsPerPage 
    },
    appointmentFilters
  );

  const appointments = appointmentsData?.data || [];
  const totalCount = appointmentsData?.total_count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Sorted appointments based on sortConfig
  const sortedAppointments = React.useMemo(() => {
    let sortableItems = [...appointments];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle specific keys
        if (sortConfig.key === 'appointment_datetime') {
          aValue = new Date(a.appointment_datetime).getTime();
          bValue = new Date(b.appointment_datetime).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [appointments, sortConfig]);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-20">
        <TopBar 
          title="Appointments"
          onBack={() => navigate('/home')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 lg:pb-4 flex-1" style={{ height: 'calc(100vh - 60px)' }}>
        <Container size="full" className="px-4 lg:px-8">
          <Stack spacing={6}>
            {/* Header with Filters */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <Typography variant="h4" weight="bold" className="text-gray-900 text-xl lg:text-2xl mb-2">
                    Appointments
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    {totalCount} total appointments
                  </Typography>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowTodaysOnly(!showTodaysOnly)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${showTodaysOnly ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    title="Toggle Today's Queue"
                  >
                    {showTodaysOnly ? "Today's Queue" : 'All Appointments'}
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters {(statusFilter !== 'all' || practitionerFilter !== 'all' || dateFrom || dateTo) && '•'}
                  </button>
                  <button
                    onClick={() => setShowAddToQueueModal(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    + Add to Queue
                  </button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <Card padding="lg" variant="elevated" className="bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date From */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date From
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    {/* Date To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date To
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="all">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Waiting">Waiting</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending Payment">Pending Payment</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Practitioner Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Practitioner
                      </label>
                      <select
                        value={practitionerFilter}
                        onChange={(e) => {
                          setPractitionerFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="all">All Practitioners</option>
                        {practitioners.map((practitioner) => (
                          <option key={practitioner.name} value={practitioner.name}>
                            {practitioner.practitioner_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(statusFilter !== 'all' || practitionerFilter !== 'all' || dateFrom || dateTo) && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setPractitionerFilter('all');
                          setDateFrom('');
                          setDateTo('');
                          setCurrentPage(1);
                        }}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Appointments List */}
            <Stack spacing={4}>
              <Flex align="center" justify="between" className="flex-wrap gap-2">
                <Typography variant="h5" weight="bold" className="text-gray-900 text-base lg:text-lg">
                  {showTodaysOnly ? "Today's Queue" : 'All Appointments'}
                </Typography>
                <Badge variant="primary" size="md" className="font-semibold">
                  {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
                </Badge>
              </Flex>

              {appointmentsLoading ? (
                // Loading skeleton
                <div>
                  <div className="hidden lg:block">
                    <Card padding="none" variant="elevated" className="bg-white overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-primary-600 text-white">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Patient Name</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Mobile Number</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Doctor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 5 }).map((_, index) => (
                              <tr key={index} className="border-b border-gray-200">
                                <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
                                <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></td>
                                <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div></td>
                                <td className="px-4 py-4"><div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div></td>
                                <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
                                <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                  <Stack spacing={3} className="lg:hidden">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} padding="md" variant="elevated" className="bg-white">
                        <Flex align="start" gap={3}>
                          <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
                          <Stack spacing={2} className="flex-1">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                          </Stack>
                        </Flex>
                      </Card>
                    ))}
                  </Stack>
                </div>
              ) : appointments.length > 0 ? (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Card padding="none" variant="elevated" className="bg-white overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th 
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('patient_name')}
                              >
                                <div className="flex items-center gap-1">
                                  Patient Name
                                  {sortConfig?.key === 'patient_name' && (
                                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                  )}
                                </div>
                              </th>
                              <th 
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('location')}
                              >
                                <div className="flex items-center gap-1">
                                  Location
                                  {sortConfig?.key === 'location' && (
                                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                  )}
                                </div>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile Number</th>
                              <th 
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('status')}
                              >
                                <div className="flex items-center gap-1">
                                  Status
                                  {sortConfig?.key === 'status' && (
                                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                  )}
                                </div>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                              <th 
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('appointment_datetime')}
                              >
                                <div className="flex items-center gap-1">
                                  Date & Time
                                  {sortConfig?.key === 'appointment_datetime' && (
                                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                  )}
                                </div>
                              </th>
                              <th 
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('practitioner_name')}
                              >
                                <div className="flex items-center gap-1">
                                  Doctor
                                  {sortConfig?.key === 'practitioner_name' && (
                                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {sortedAppointments.map((appointment) => (
                              <tr 
                                key={appointment.name || appointment.appointment_id}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => handleAppointmentClick(appointment)}
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <Avatar 
                                      size="sm"
                                      name={appointment.patient_name}
                                      className="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0"
                                    />
                                    <Typography variant="body2" weight="semibold" className="text-gray-900 text-sm">
                                      {appointment.patient_name}
                                    </Typography>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Typography variant="body2" className="text-gray-600 text-sm">
                                    {appointment.location || '-'}
                                  </Typography>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Typography variant="body2" className="text-gray-600 text-sm">
                                    {appointment.patient_mobile || appointment.patient || 'N/A'}
                                  </Typography>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge 
                                    variant={
                                      appointment.status === 'Confirmed' || appointment.status === 'Completed' ? 'success' :
                                      appointment.status === 'Scheduled' || appointment.status === 'Open' ? 'primary' :
                                      appointment.status === 'Waiting' || appointment.status === 'In Progress' ? 'warning' :
                                      appointment.status === 'Cancelled' ? 'danger' :
                                      'primary'
                                    }
                                    size="sm"
                                  >
                                    <span className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                                      {appointment.status}
                                    </span>
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <Flex gap={1}>
                                    {/* Status-based action buttons */}
                                    {(appointment.status === 'Open' || appointment.status === 'Scheduled') && (
                                      <button
                                        onClick={() => handleCheckIn(appointment.name || appointment.appointment_id || '')}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                        title="Check In"
                                        disabled={isUpdating || isCancelling || isDeleting}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </button>
                                    )}
                                    {appointment.status === 'Waiting' && (
                                      <button
                                        onClick={() => handleStartVisit(appointment.name || appointment.appointment_id || '')}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Start Visit"
                                        disabled={isUpdating || isCancelling || isDeleting}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </button>
                                    )}
                                    {appointment.status === 'In Progress' && (
                                      <button
                                        onClick={() => handleCompleteVisit(appointment.name || appointment.appointment_id || '')}
                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                        title="Complete Visit"
                                        disabled={isUpdating || isCancelling || isDeleting}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </button>
                                    )}
                                    {/* Edit Button */}
                                    <button
                                      onClick={(e) => handleEditAppointment(appointment, e)}
                                      disabled={isUpdating || isCancelling || isDeleting}
                                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Edit Appointment"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    {/* Delete Button */}
                                    <button
                                      onClick={(e) => handleDeleteAppointment(appointment.name || appointment.appointment_id || '', e)}
                                      disabled={isUpdating || isCancelling || isDeleting}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Delete Appointment"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                    {/* Cancel Button for scheduled appointments */}
                                    {(appointment.status === 'Open' || appointment.status === 'Scheduled' || appointment.status === 'Waiting') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm('Are you sure you want to cancel this appointment?')) {
                                            const type = appointment.appointment_type || 'Consultation';
                                            cancelAppointment({
                                              appointment_id: appointment.name || appointment.appointment_id || '',
                                              reason: 'Cancelled by doctor',
                                              appointment_type: type,
                                              type: type,
                                              practitioner: appointment.practitioner,
                                              appointment_for: 'Practitioner',
                                            });
                                          }
                                        }}
                                        disabled={isUpdating || isCancelling || isDeleting}
                                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Cancel Appointment"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    )}
                                  </Flex>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex flex-col gap-0.5">
                                    <Typography variant="body2" className="text-gray-900 font-medium text-sm">
                                      {new Date(appointment.appointment_datetime).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </Typography>
                                    <Typography variant="caption" className="text-gray-500 text-xs">
                                      {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </Typography>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Typography variant="body2" className="text-gray-600 text-sm">
                                    {appointment.practitioner_name || '-'}
                                  </Typography>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>

                  {/* Mobile Card View */}
                  <Stack spacing={2} className="lg:hidden p-3">
                    {sortedAppointments.map((appointment) => (
                    <Card 
                      key={appointment.name || appointment.appointment_id} 
                      padding="md"
                      variant="elevated"
                      hoverable
                      className="cursor-pointer bg-white border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <Flex align="start" gap={3}>
                        <Avatar 
                          size="md" 
                          name={appointment.patient_name}
                          className="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0"
                        />
                        <Stack spacing={2} className="flex-1 min-w-0">
                          <div>
                            <Typography variant="body1" weight="semibold" className="text-gray-900 text-sm">
                              {appointment.patient_name}
                            </Typography>
                            <Flex align="center" gap={2} className="mt-1">
                              <Badge 
                                variant={
                                  appointment.status === 'Confirmed' || appointment.status === 'Completed' ? 'success' :
                                  appointment.status === 'Scheduled' || appointment.status === 'Open' ? 'primary' :
                                  appointment.status === 'Waiting' || appointment.status === 'In Progress' ? 'warning' :
                                  appointment.status === 'Cancelled' ? 'danger' :
                                  'primary'
                                }
                                size="sm"
                              >
                                <span className="flex items-center gap-1 text-xs">
                                  <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                                  {appointment.status}
                                </span>
                              </Badge>
                            </Flex>
                          </div>

                          <div className="space-y-1">
                            <Flex align="center" gap={2}>
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <Typography variant="caption" className="text-gray-600 text-xs">
                                {appointment.patient_mobile || 'No phone'}
                              </Typography>
                            </Flex>
                            
                            <Flex align="center" gap={2}>
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <Typography variant="caption" className="text-gray-600 text-xs">
                                {new Date(appointment.appointment_datetime).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </Typography>
                              <Typography variant="caption" className="text-gray-400">•</Typography>
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <Typography variant="caption" className="text-gray-600 text-xs">
                                {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </Typography>
                            </Flex>

                            {appointment.practitioner_name && (
                              <Flex align="center" gap={2}>
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <Typography variant="caption" className="text-gray-600 text-xs">
                                  Dr. {appointment.practitioner_name}
                                </Typography>
                              </Flex>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2" onClick={(e) => e.stopPropagation()}>
                            <Flex gap={2}>
                              {/* Status-based action buttons */}
                              {(appointment.status === 'Open' || appointment.status === 'Scheduled') && (
                                <button
                                  onClick={() => handleCheckIn(appointment.name || appointment.appointment_id || '')}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Check In"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              )}
                              {appointment.status === 'Waiting' && (
                                <button
                                  onClick={() => handleStartVisit(appointment.name || appointment.appointment_id || '')}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Start Visit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              )}
                              {appointment.status === 'In Progress' && (
                                <button
                                  onClick={() => handleCompleteVisit(appointment.name || appointment.appointment_id || '')}
                                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                  title="Complete Visit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAppointment(appointment, e);
                                }}
                                disabled={isUpdating || isCancelling || isDeleting}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                title="Edit Appointment"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleDeleteAppointment(appointment.name || appointment.appointment_id || '', e)}
                                disabled={isUpdating || isCancelling || isDeleting}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete Appointment"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </Flex>
                          </div>
                        </Stack>
                      </Flex>
                    </Card>
                  ))}
                </Stack>
                </div>
              ) : (
                <Card padding="lg" variant="elevated" className="bg-white shadow-sm">
                  <Stack spacing={4} align="center" className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <Stack spacing={1} align="center">
                      <Typography variant="h6" weight="bold" className="text-gray-900 text-base sm:text-lg">
                        No appointments scheduled
                      </Typography>
                      <Typography variant="body2" className="text-gray-500 text-sm">
                        No appointments found for this date
                      </Typography>
                    </Stack>
                  </Stack>
                </Card>
              )}
            </Stack>

            {/* Pagination for Today's Appointments */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} rows
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(<span key="ellipsis1" className="px-2">...</span>);
                      }
                    }
                    
                    for (let pageNum: number = startPage; pageNum <= endPage; pageNum++) {
                      pages.push(
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 border rounded text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(<span key="ellipsis2" className="px-2">...</span>);
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}



            {/* Floating Action Button */}
            <div className="fixed bottom-24 right-6 z-10">
              <button
                onClick={() => navigate('/appointments/new')}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </Stack>
        </Container>
        </div>

        {/* Edit Appointment Modal */}
        {showEditModal && editingAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <Flex align="center" justify="between" className="mb-6">
                  <Typography variant="h5" weight="bold" className="text-gray-900">
                    Edit Appointment
                  </Typography>
                  <button
                    onClick={handleCloseEditModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Flex>

                <Stack spacing={4}>
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <Typography variant="body2" weight="semibold" className="text-primary-900">
                      Patient: {editingAppointment.patient_name}
                    </Typography>
                  </div>

                  <InputField
                    label="Appointment Date"
                    type="date"
                    value={editingAppointment.appointment_date}
                    disabled
                  />

                  <InputField
                    label="Appointment Time"
                    type="time"
                    value={editingAppointment.appointment_time}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, appointment_time: e.target.value })}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={editingAppointment.notes}
                      onChange={(e) => setEditingAppointment({ ...editingAppointment, notes: e.target.value })}
                      placeholder="Add appointment notes..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <Flex gap={3} className="mt-6">
                    <Button
                      variant="outline"
                      onClick={handleCloseEditModal}
                      className="flex-1"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleUpdateAppointment}
                      className="flex-1"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Appointment'}
                    </Button>
                  </Flex>
                </Stack>
              </div>
            </div>
          </div>
        )}

        {/* Add to Today's Queue Modal */}
        {showAddToQueueModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <Flex align="center" justify="between" className="mb-6">
                  <Typography variant="h5" weight="bold" className="text-gray-900">
                    Add to Today's Queue
                  </Typography>
                  <button
                    onClick={() => {
                      setShowAddToQueueModal(false);
                      setSelectedPatientForQueue('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Flex>

                <Stack spacing={4}>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Search
                    </label>
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setShowPatientDropdown(true);
                        if (!e.target.value) setSelectedPatientForQueue('');
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Search patient by name or ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    
                    {showPatientDropdown && patientSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {patientsList.map(patient => (
                            <button
                              type="button"
                              key={patient.name}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatientForQueue(patient.name);
                                setPatientSearch(patient.patient_name);
                                setShowPatientDropdown(false);
                              }}
                            >
                              <div className="font-medium text-gray-900">{patient.patient_name}</div>
                              <div className="text-xs text-gray-500">{patient.name} • {patient.mobile}</div>
                            </button>
                          ))}
                        {patientsList.length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">No patients found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Practitioner</label>
                    <select
                      value={selectedPractitionerForQueue}
                      onChange={(e) => setSelectedPractitionerForQueue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {practitioners.map((p) => (
                        <option key={p.name} value={p.name}>{p.practitioner_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Typography variant="body2" className="text-blue-900">
                      ℹ️ The system will automatically find the nearest available slot in today's queue.
                    </Typography>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Optional Time (override)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={overrideQueueTime}
                        onChange={(e) => setOverrideQueueTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {overrideQueueTime && (
                        <div className="text-sm text-gray-600">
                          {(() => {
                            const matched = todaysSlots.find((s: any) => s.time === overrideQueueTime || s.time?.startsWith(overrideQueueTime));
                            if (matched && typeof matched.existing_appointments !== 'undefined' && matched.existing_appointments > 0) {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                  {matched.existing_appointments} bookings
                                </span>
                              );
                            }
                            return <span className="text-xs text-gray-500">No known occupancy</span>;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Patient Search Results (shown when dropdown is closed) */}
                  {patientSearch && !showPatientDropdown && (
                    <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
                      {patientsList.length > 0 ? (
                        patientsList.map((patient) => (
                          <button
                            type="button"
                            key={patient.name}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientForQueue(patient.name);
                              setPatientSearch(patient.patient_name);
                              setShowPatientDropdown(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar 
                                size="sm"
                                name={patient.patient_name}
                                className="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0"
                              />
                              <div className="flex flex-col">
                                <Typography variant="body2" className="text-gray-900 text-sm">
                                  {patient.patient_name}
                                </Typography>
                                <Typography variant="caption" className="text-gray-500">
                                  {patient.name}
                                </Typography>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No patients found
                        </div>
                      )}
                    </div>
                  )}

                  <Flex gap={3} className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddToQueueModal(false);
                        setSelectedPatientForQueue('');
                      }}
                      className="flex-1"
                      disabled={isAddingToQueue}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleAddToTodaysQueue}
                      className="flex-1"
                      disabled={isAddingToQueue || !selectedPatientForQueue}
                    >
                      {isAddingToQueue ? 'Adding...' : 'Add to Queue'}
                    </Button>
                  </Flex>
                </Stack>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default AppointmentsPage;
