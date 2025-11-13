import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Stack, Card, Typography, Badge, Avatar, Flex, InputField, Sidebar } from '../components';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import { useAppointmentsByDate, useUpcomingAppointments } from '../hooks/useAppointments';
import { Appointment } from '../types';

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('appointments');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
    // Use patient_id (which contains patient name in Frappe), fallback to patient_name
    const patientIdentifier = appointment.patient_id || appointment.patient_name;
    if (patientIdentifier) {
      navigate(`/prescriptions/${encodeURIComponent(patientIdentifier)}`);
    } else {
      console.error('No patient identifier found for appointment:', appointment);
    }
  };

  // Real API data instead of mock data
  const { 
    data: selectedDateAppointments, 
    isLoading: appointmentsLoading 
  } = useAppointmentsByDate(selectedDate);
  
  const { 
    data: upcomingAppointments, 
    isLoading: upcomingLoading 
  } = useUpcomingAppointments();

  const todaysAppointments = selectedDateAppointments || [];

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
                  Manage your appointments
                </Typography>
              </div>
              
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
                            {todaysAppointments.map((appointment, index) => (
                              <tr 
                                key={appointment.appointment_id}
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
                                    Thrissur
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-600">
                                    {appointment.patient_id || 'N/A'}
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
                                  <Typography variant="body2" className="text-gray-900 font-medium">
                                    {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-600">
                                    Dr. Avinash
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
                      key={appointment.appointment_id} 
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
                                key={appointment.appointment_id}
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
                                    Thrissur
                                  </Typography>
                                </td>
                                <td className="px-6 py-4">
                                  <Typography variant="body2" className="text-gray-600">
                                    {appointment.patient_id || 'N/A'}
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
                                    Dr. Avinash
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
                        key={appointment.appointment_id}
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

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default AppointmentsPage;
