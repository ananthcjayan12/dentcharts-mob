import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Stack, Card, Typography, Badge, Avatar, Flex, InputField, Sidebar, Button } from '../components';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import { useAppointments, useUpcomingAppointments, useUpdateAppointment, useCancelAppointment, useDeleteAppointment, useAddToTodaysQueue, useTodaysQueue } from '../hooks/useAppointments';
import { Appointment } from '../types';
import toast from 'react-hot-toast';

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('appointments');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddToQueueModal, setShowAddToQueueModal] = useState(false);
  const [selectedPatientForQueue, setSelectedPatientForQueue] = useState<string>('');
  const { mutate: updateAppointment, isPending: isUpdating } = useUpdateAppointment();
  const { mutate: cancelAppointment, isPending: isCancelling } = useCancelAppointment();
  const { mutate: deleteAppointment, isPending: isDeleting } = useDeleteAppointment();
  const { mutate: addToQueue, isPending: isAddingToQueue } = useAddToTodaysQueue();

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
    });
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    updateAppointment({
      appointment_id: editingAppointment.appointment_id,
      appointment_time: editingAppointment.appointment_time + ':00',
      notes: editingAppointment.notes,
    }, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingAppointment(null);
      }
    });
  };

  const handleCancelAppointment = async (appointmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    cancelAppointment({
      appointment_id: appointmentId,
      reason: 'Cancelled by doctor',
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
      await addToQueue({
        patient_id: selectedPatientForQueue,
        duration: 30,
        appointment_type: 'Walk In',
      });
      setShowAddToQueueModal(false);
      setSelectedPatientForQueue('');
    } catch (error: any) {
      console.error('Add to queue error:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Real API data with pagination
  const { 
    data: appointmentsData, 
    isLoading: appointmentsLoading 
  } = useAppointments(
    { 
      limit_page_length: itemsPerPage, 
      limit_start: (currentPage - 1) * itemsPerPage 
    },
    { 
      date_from: selectedDate, 
      date_to: selectedDate 
    }
  );
  
  const { 
    data: upcomingAppointmentsData, 
    isLoading: upcomingLoading 
  } = useAppointments(
    { 
      limit_page_length: 20, 
      limit_start: 0 
    },
    { 
      date_from: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
      date_to: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
    }
  );

  const { 
    data: todaysQueueData, 
    isLoading: queueLoading 
  } = useTodaysQueue();

  const todaysAppointments = appointmentsData?.data || [];
  const upcomingAppointments = upcomingAppointmentsData?.data || [];
  const totalCount = appointmentsData?.total_count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const todaysQueue = todaysQueueData?.queue || [];

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
            {/* Header with Date Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <Typography variant="h4" weight="bold" className="text-gray-900 text-xl lg:text-2xl mb-2">
                  Clinic Queue
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  {totalCount} total appointments
                </Typography>
              </div>
              <button
                onClick={() => setShowAddToQueueModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add to Today's Queue
              </button>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Today's Queue Section */}
            {todaysQueue.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Today's Queue</h3>
                <div className="space-y-2">
                  {todaysQueue.slice(0, 5).map((appointment: any) => (
                    <div key={appointment.name || appointment.appointment_id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                          {appointment.queue_position}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                          <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{appointment.appointment_type}</span>
                    </div>
                  ))}
                </div>
                {todaysQueue.length > 5 && (
                  <p className="text-sm text-gray-600 mt-3 text-center">
                    + {todaysQueue.length - 5} more in queue
                  </p>
                )}
              </div>
            )}

            {/* Selected Date Appointments */}
            <Stack spacing={4}>
              <Flex align="center" justify="between" className="flex-wrap gap-2">
                <Typography variant="h5" weight="bold" className="text-gray-900 text-base lg:text-lg">
                  Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Badge variant="primary" size="md" className="font-semibold">
                  {todaysAppointments.length} {todaysAppointments.length === 1 ? 'appointment' : 'appointments'}
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
              ) : todaysAppointments.length > 0 ? (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Card padding="none" variant="elevated" className="bg-white overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-primary-600 text-white">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Patient Name</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Location</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Mobile Number</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Time</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Doctor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {todaysAppointments.map((appointment) => (
                              <tr 
                                key={appointment.name || appointment.appointment_id}
                                className="hover:bg-primary-50 cursor-pointer transition-colors"
                                onClick={() => handleAppointmentClick(appointment)}
                              >
                                <td className="px-6 py-4">
                                  <Typography variant="body2" weight="semibold" className="text-gray-900">
                                    {appointment.patient_name}
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-600">
                                    {appointment.location || '-'}
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-600">
                                    {appointment.patient_mobile || appointment.patient || 'N/A'}
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge 
                                    variant={
                                      appointment.status === 'Confirmed' ? 'success' :
                                      appointment.status === 'Scheduled' ? 'primary' :
                                      appointment.status === 'Cancelled' ? 'danger' :
                                      'primary'
                                    }
                                    size="md"
                                    className="font-medium"
                                  >
                                    {appointment.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <Flex gap={2}>
                                    <button
                                      onClick={(e) => handleEditAppointment(appointment, e)}
                                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                      title="Edit Appointment"
                                      disabled={isUpdating || isCancelling || isDeleting}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteAppointment(appointment.name || appointment.appointment_id || '', e)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Delete Appointment"
                                      disabled={isUpdating || isCancelling || isDeleting}
                                    >
                                      🗑️
                                    </button>
                                    <button
                                      onClick={(e) => handleCancelAppointment(appointment.name || appointment.appointment_id || '', e)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Cancel Appointment"
                                      disabled={isUpdating || isCancelling || isDeleting}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </Flex>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-900 font-medium">
                                    {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-600">
                                    {appointment.practitioner || '-'}
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
                  <Stack spacing={3} className="lg:hidden">
                    {todaysAppointments.map((appointment) => (
                    <Card 
                      key={appointment.name || appointment.appointment_id} 
                      padding="lg"
                      variant="elevated"
                      hoverable
                      className="cursor-pointer bg-white shadow-sm border-l-4 border-l-primary-500"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <Flex align="center" gap={4}>
                        <Avatar 
                          size="lg" 
                          name={appointment.patient_name}
                          className="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0 shadow-md"
                        />
                        <Stack spacing={2} className="flex-1 min-w-0">
                          <Typography variant="h6" weight="bold" className="text-gray-900 text-sm sm:text-base truncate">
                            {appointment.patient_name}
                          </Typography>
                          <Flex align="center" gap={2} className="flex-wrap">
                            <div className="flex items-center gap-1 text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm font-medium">
                                {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </Typography>
                            </div>
                            <Typography variant="caption" className="text-gray-400">•</Typography>
                            <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                              Consultation
                            </Typography>
                          </Flex>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                appointment.status === 'Confirmed' ? 'success' :
                                appointment.status === 'Scheduled' ? 'warning' :
                                appointment.status === 'Cancelled' ? 'danger' :
                                'primary'
                              }
                              size="md"
                              dot
                              className="font-semibold"
                            >
                              {appointment.status}
                            </Badge>
                            {appointment.patient_id && (
                              <Typography variant="caption" className="text-gray-400 text-xs">
                                PID: {appointment.patient_id}
                              </Typography>
                            )}
                          </div>
                        </Stack>
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Flex>
                      
                      {/* Action Buttons for Mobile */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAppointment(appointment, e);
                          }}
                          disabled={isUpdating || isCancelling || isDeleting}
                          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteAppointment(appointment.name || appointment.appointment_id || '', e)}
                          disabled={isUpdating || isCancelling || isDeleting}
                          className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          🗑️
                        </button>
                        {appointment.status === 'Scheduled' && (
                          <button
                            onClick={(e) => handleCancelAppointment(appointment.name || appointment.appointment_id || '', e)}
                            disabled={isUpdating || isCancelling || isDeleting}
                            className="flex-1 px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
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

            {/* Upcoming Appointments - Only show when not loading and has data */}
            {!upcomingLoading && upcomingAppointments && upcomingAppointments.length > 0 && (
              <Stack spacing={4}>
                <Typography variant="h5" weight="bold" className="text-gray-900 text-lg sm:text-xl">
                  Upcoming Appointments
                </Typography>

                <div>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Card padding="none" variant="elevated" className="bg-white overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-success-600 text-white">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Patient Name</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Location</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Mobile Number</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Date & Time</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold">Doctor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {upcomingAppointments.map((appointment) => (
                              <tr 
                                key={appointment.name || appointment.appointment_id}
                                className="hover:bg-success-50 cursor-pointer transition-colors"
                                onClick={() => handleAppointmentClick(appointment)}
                              >
                                <td className="px-6 py-4">
                                  <Typography variant="body2" weight="semibold" className="text-gray-900">
                                    {appointment.patient_name}
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-600">
                                    {appointment.location || '-'}
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-600">
                                    {appointment.patient_mobile || appointment.patient || 'N/A'}
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge 
                                    variant={
                                      appointment.status === 'Confirmed' ? 'success' :
                                      appointment.status === 'Scheduled' ? 'primary' :
                                      appointment.status === 'Cancelled' ? 'danger' :
                                      'primary'
                                    }
                                    size="md"
                                    className="font-medium"
                                  >
                                    {appointment.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <button className="text-danger-600 hover:text-danger-700 font-medium text-sm">
                                    Cancel Visit
                                  </button>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                    <Typography variant="body2" className="text-gray-900 font-medium">
                                      {new Date(appointment.appointment_datetime).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </Typography>
                                    <Typography variant="body2" className="text-gray-600">
                                      {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </Typography>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-600">
                                    {appointment.practitioner || '-'}
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
                  <Stack spacing={3} className="lg:hidden">
                    {upcomingAppointments.map((appointment) => (
                      <Card 
                        key={appointment.name || appointment.appointment_id}
                        padding="lg"
                        variant="elevated"
                        hoverable
                        className="cursor-pointer bg-white shadow-sm border-l-4 border-l-success-500"
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <Flex align="center" gap={4}>
                          <Avatar 
                            size="lg" 
                            name={appointment.patient_name}
                            className="bg-gradient-to-br from-success-500 to-success-600 text-white flex-shrink-0 shadow-md"
                          />
                          <Stack spacing={2} className="flex-1 min-w-0">
                            <Typography variant="h6" weight="bold" className="text-gray-900 text-sm sm:text-base truncate">
                              {appointment.patient_name}
                            </Typography>
                            <Flex align="center" gap={2} className="flex-wrap">
                              <div className="flex items-center gap-1 text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm font-medium">
                                  {new Date(appointment.appointment_datetime).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </Typography>
                              </div>
                              <Typography variant="caption" className="text-gray-400">•</Typography>
                              <div className="flex items-center gap-1 text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm font-medium">
                                  {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </Typography>
                              </div>
                            </Flex>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  appointment.status === 'Confirmed' ? 'success' :
                                  appointment.status === 'Scheduled' ? 'warning' :
                                  appointment.status === 'Cancelled' ? 'danger' :
                                  'primary'
                                }
                                size="md"
                                dot
                                className="font-semibold"
                              >
                                {appointment.status}
                              </Badge>
                            </div>
                          </Stack>
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Flex>
                      </Card>
                    ))}
                  </Stack>
                </div>
              </Stack>
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
                  <InputField
                    label="Patient ID or Name"
                    type="text"
                    value={selectedPatientForQueue}
                    onChange={(e) => setSelectedPatientForQueue(e.target.value)}
                    placeholder="Enter patient ID or name"
                  />

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Typography variant="body2" className="text-blue-900">
                      ℹ️ The system will automatically find the nearest available slot in today's queue.
                    </Typography>
                  </div>

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
