import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Grid, Stack, Flex, Card, Button, Typography, Badge, Avatar, Divider, InputField, Sidebar } from '../components';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import { useAppointmentsDashboard } from '../hooks/useAppointments';
import { usePatientStats } from '../hooks/usePatients';
import { Appointment } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');

  // Real API data instead of mock data
  const {
    todaysAppointments,
    upcomingAppointments,
    todayCount,
    upcomingCount,
    pendingCount,
    confirmedCount,
    isLoading: appointmentsLoading,
    refetchTodays,
  } = useAppointmentsDashboard();

  const { 
    data: patientStats,
    isLoading: patientsLoading 
  } = usePatientStats();

  const isLoading = appointmentsLoading || patientsLoading;

  // Utility functions for displaying appointment data
  const formatAppointmentTime = (datetime: string) => {
    try {
      return new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid time';
    }
  };

  const formatAppointmentDate = (datetime: string) => {
    try {
      return new Date(datetime).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

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
    if (query.trim()) {
      // In a real app, this would search and navigate to results
      navigate(`/appointments?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative lg:pl-20">
        <TopBar 
          title="DentCare Dashboard"
          variant="gradient"
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 lg:pb-4 pt-4 flex-1" style={{ height: 'calc(100vh - 72px)' }}>
        <Container size="xl">
          <Stack spacing={4}>
          {/* Welcome Header */}
          <Card variant="elevated" padding="lg" className="bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0 shadow-lg">
            <Flex align="center" justify="between">
              <Stack spacing={1} className="flex-1">
                <Typography variant="h5" className="text-white font-bold text-base sm:text-lg md:text-xl">
                  Welcome back, {user?.name || 'Dr. Pooja'}!
                </Typography>
                <Typography variant="body2" className="text-white/90 text-xs sm:text-sm">
                  Dr Pooja's Smilecraft Dental Clinic
                </Typography>
                <Typography variant="caption" className="text-white/75 text-xs">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
              </Stack>
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">👩‍⚕️</span>
                </div>
                {todaysAppointments.length > 0 && (
                  <Badge 
                    variant="danger" 
                    className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center"
                  >
                    {todaysAppointments.length}
                  </Badge>
                )}
              </div>
            </Flex>
          </Card>

          {/* Quick Search */}
          <Card padding="sm">
            <InputField
              placeholder="Search patients, appointments..."
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              size="md"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e.currentTarget.value);
                }
              }}
            />
          </Card>

          {/* Statistics Overview */}
          <Grid cols={{ xs: 2, sm: 2, lg: 4 }} gap={3}>
            <Card padding="lg" hoverable className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm">
              <Stack spacing={2} align="center">
                <Typography variant="h2" className="text-primary-700 text-3xl sm:text-4xl md:text-5xl font-bold">
                  {isLoading ? '...' : todayCount}
                </Typography>
                <Stack spacing={0} align="center">
                  <Typography variant="body2" className="text-gray-800 text-sm sm:text-base font-semibold">
                    Today's Appointments
                  </Typography>
                  <Typography variant="caption" className="text-gray-600 text-xs">
                    {confirmedCount} confirmed • {pendingCount} pending
                  </Typography>
                </Stack>
              </Stack>
            </Card>

            <Card padding="lg" hoverable className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-sm">
              <Stack spacing={2} align="center">
                <Typography variant="h2" className="text-green-700 text-3xl sm:text-4xl md:text-5xl font-bold">
                  {isLoading ? '...' : (patientStats?.totalPatients || 0)}
                </Typography>
                <Stack spacing={0} align="center">
                  <Typography variant="body2" className="text-gray-800 text-sm sm:text-base font-semibold">
                    Total Patients
                  </Typography>
                  <Typography variant="caption" className="text-gray-600 text-xs">
                    Registered
                  </Typography>
                </Stack>
              </Stack>
            </Card>

            <Card padding="lg" hoverable className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-sm">
              <Stack spacing={2} align="center">
                <Typography variant="h2" className="text-purple-700 text-3xl sm:text-4xl md:text-5xl font-bold">
                  {isLoading ? '...' : upcomingCount}
                </Typography>
                <Stack spacing={0} align="center">
                  <Typography variant="body2" className="text-gray-800 text-sm sm:text-base font-semibold">
                    Upcoming
                  </Typography>
                  <Typography variant="caption" className="text-gray-600 text-xs">
                    Next 7 days
                  </Typography>
                </Stack>
              </Stack>
            </Card>

            <Card padding="lg" hoverable className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow-sm">
              <Stack spacing={2} align="center">
                <Typography variant="h2" className="text-orange-700 text-3xl sm:text-4xl md:text-5xl font-bold">
                  {isLoading ? '...' : (patientStats?.totalPatients || 0)}
                </Typography>
                <Stack spacing={0} align="center">
                  <Typography variant="body2" className="text-gray-800 text-sm sm:text-base font-semibold">
                    This Month
                  </Typography>
                  <Typography variant="caption" className="text-gray-600 text-xs">
                    New patients
                  </Typography>
                </Stack>
              </Stack>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Stack spacing={3}>
            <Typography variant="h6" className="text-gray-900 text-base sm:text-lg font-bold">
              Quick Actions
            </Typography>
            <Grid cols={{ xs: 2, sm: 2, md: 4 }} gap={3}>
              <Card 
                padding="lg"
                hoverable
                className="text-center cursor-pointer bg-white shadow-sm" 
                onClick={() => navigate('/appointments/new', { state: { backgroundLocation: location } })}
              >
                <Stack spacing={3} align="center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <Stack spacing={1} align="center">
                    <Typography variant="body1" weight="bold" className="text-gray-900 text-sm sm:text-base">
                      New Appointment
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 text-xs">
                      Schedule patient visit
                    </Typography>
                  </Stack>
                </Stack>
              </Card>

              <Card 
                padding="lg"
                hoverable
                className="text-center cursor-pointer bg-white shadow-sm" 
                onClick={() => navigate('/patients')}
              >
                <Stack spacing={3} align="center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <Stack spacing={1} align="center">
                    <Typography variant="body1" weight="bold" className="text-gray-900 text-sm sm:text-base">
                      View Patients
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 text-xs">
                      Manage patient records
                    </Typography>
                  </Stack>
                </Stack>
              </Card>

              <Card 
                padding="lg"
                hoverable
                className="text-center cursor-pointer bg-white shadow-sm" 
                onClick={() => navigate('/appointments')}
              >
                <Stack spacing={3} align="center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <Stack spacing={1} align="center">
                    <Typography variant="body1" weight="bold" className="text-gray-900 text-sm sm:text-base">
                      All Appointments
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 text-xs">
                      View schedule
                    </Typography>
                  </Stack>
                </Stack>
              </Card>

              <Card 
                padding="lg"
                hoverable
                className="text-center cursor-pointer bg-white shadow-sm" 
                onClick={() => navigate('/invoice')}
              >
                <Stack spacing={3} align="center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <Stack spacing={1} align="center">
                    <Typography variant="body1" weight="bold" className="text-gray-900 text-sm sm:text-base">
                      New Invoice
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 text-xs">
                      Create billing
                    </Typography>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          </Stack>

          {/* Today's Schedule */}
          {todaysAppointments.length > 0 && (
            <Stack spacing={3}>
              <Flex align="center" justify="between">
                <Typography variant="h6" className="text-gray-700 text-sm sm:text-base font-bold">
                  Today's Schedule
                </Typography>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                >
                  View All
                </Button>
              </Flex>

              <Stack spacing={3}>
                {isLoading ? (
                  // Loading skeleton for today's appointments
                  Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} padding="md" hoverable className="cursor-pointer">
                      <Flex align="center" justify="between">
                        <Flex align="center" gap={3}>
                          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                          <Stack spacing={1}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                          </Stack>
                        </Flex>
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </Flex>
                    </Card>
                  ))
                ) : todaysAppointments && todaysAppointments.length > 0 ? (
                  todaysAppointments.map((appointment) => (
                    <Card 
                      key={appointment.appointment_id}
                      padding="md"
                      hoverable
                      className="cursor-pointer"
                      onClick={() => {
                        const patientIdentifier = appointment.patient_id || appointment.patient_name;
                        if (patientIdentifier) {
                          navigate(`/prescriptions/${encodeURIComponent(patientIdentifier)}`);
                        }
                      }}
                    >
                      <Flex align="center" justify="between">
                        <Flex align="center" gap={3}>
                          <Avatar size="md" name={appointment.patient_name} className="bg-blue-500 text-white" />
                          <Stack spacing={0}>
                            <Typography variant="body1" weight="semibold" className="text-gray-800 text-xs sm:text-sm">
                              {appointment.patient_name}
                            </Typography>
                            <Typography variant="caption" className="text-gray-600 text-xs">
                              {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} • Consultation
                            </Typography>
                          </Stack>
                        </Flex>
                        <Badge 
                          variant={
                            appointment.status === 'Confirmed' ? 'success' :
                            appointment.status === 'Scheduled' ? 'warning' :
                            'primary'
                          }
                          size="sm"
                        >
                          {appointment.status}
                        </Badge>
                      </Flex>
                    </Card>
                  ))
                ) : (
                  <Card padding="lg" className="text-center">
                    <Stack spacing={2} align="center">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                      <Typography variant="body2" className="text-gray-500 text-xs sm:text-sm">
                        No appointments scheduled for today
                      </Typography>
                    </Stack>
                  </Card>
                )}
              </Stack>
            </Stack>
          )}

          {/* Upcoming Appointments */}
          {(!isLoading && upcomingAppointments.length > 0) && (
            <Stack spacing={3}>
              <Flex align="center" justify="between">
                <Typography variant="h6" className="text-gray-700 text-sm sm:text-base font-bold">
                  Upcoming This Week
                </Typography>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                >
                  View All
                </Button>
              </Flex>

              <Stack spacing={3}>
                {upcomingAppointments.map((appointment) => (
                  <Card 
                    key={appointment.appointment_id}
                    padding="md"
                    hoverable
                    className="cursor-pointer"
                    onClick={() => {
                      const patientIdentifier = appointment.patient_id || appointment.patient_name;
                      if (patientIdentifier) {
                        navigate(`/prescriptions/${encodeURIComponent(patientIdentifier)}`);
                      }
                    }}
                  >
                    <Flex align="center" justify="between">
                      <Stack spacing={1}>
                        <Typography variant="body1" weight="semibold" className="text-gray-800 text-xs sm:text-sm">
                          {appointment.patient_name}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600 text-xs">
                          {new Date(appointment.appointment_datetime).toLocaleDateString()} • {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500 text-xs">
                          Consultation
                        </Typography>
                      </Stack>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            </Stack>
          )}

          {/* Empty State */}
          {!isLoading && todaysAppointments.length === 0 && upcomingAppointments.length === 0 && (
            <Card padding="lg">
              <Stack spacing={4} align="center" className="text-center py-4 sm:py-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <Stack spacing={2} align="center">
                  <Typography variant="h6" className="text-gray-700 text-sm sm:text-base md:text-lg font-bold">
                    No appointments scheduled
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 text-xs sm:text-sm">
                    Start by creating a new appointment for your patients
                  </Typography>
                </Stack>
                <Button onClick={() => navigate('/appointments/new', { state: { backgroundLocation: location } })} size="md">
                  Create Appointment
                </Button>
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default HomePage;
