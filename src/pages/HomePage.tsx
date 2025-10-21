import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { mockAppointments, mockPatients } from '../data/mockData';
import { Appointment } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');

  // Get today's date and statistics
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = mockAppointments.filter((apt: Appointment) => apt.date === today);
  const upcomingAppointments = mockAppointments
    .filter((apt: Appointment) => apt.date > today)
    .slice(0, 3);

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
        navigate('/appointments/new');
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
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white relative">
        {/* Status Bar Styling */}
        <div className="h-1 bg-gradient-to-r from-primary-500 to-green-400"></div>
        
        <TopBar 
          title="DentCare Dashboard"
          variant="gradient"
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 pt-4" style={{ height: 'calc(100vh - 72px)' }}>
          <div className="px-4 space-y-4">
          {/* Welcome Header */}
          <Card variant="elevated" className="bg-gradient-to-r from-primary-500 to-green-400 text-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-lg font-bold font-lato mb-1">
                  Welcome back, {user?.name || 'Dr. Pooja'}!
                </h1>
                <p className="text-sm opacity-90 font-montserrat">
                  Dr Pooja's Smilecraft Dental Clinic
                </p>
                <p className="text-xs opacity-75 font-montserrat">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-2xl">👩‍⚕️</span>
                </div>
                {todaysAppointments.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {todaysAppointments.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Search */}
          <Card>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search patients, appointments..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e.currentTarget.value);
                  }
                }}
              />
            </div>
          </Card>

          {/* Statistics Overview */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-2xl font-bold text-primary-600 font-lato">
                {todaysAppointments.length}
              </div>
              <p className="text-xs text-gray-600 font-montserrat">
                Today's Appointments
              </p>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-green-600 font-lato">
                {mockPatients.length}
              </div>
              <p className="text-xs text-gray-600 font-montserrat">
                Total Patients
              </p>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-blue-600 font-lato">
                {upcomingAppointments.length}
              </div>
              <p className="text-xs text-gray-600 font-montserrat">
                Upcoming
              </p>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-base font-bold text-gray-700 font-lato mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="text-center cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/appointments/new')}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-gray-700 font-lato">
                  New Appointment
                </h4>
                <p className="text-xs text-gray-500 font-montserrat mt-1">
                  Schedule patient visit
                </p>
              </Card>

              <Card 
                className="text-center cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/patients')}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-gray-700 font-lato">
                  View Patients
                </h4>
                <p className="text-xs text-gray-500 font-montserrat mt-1">
                  Manage patient records
                </p>
              </Card>

              <Card 
                className="text-center cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/appointments')}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-gray-700 font-lato">
                  All Appointments
                </h4>
                <p className="text-xs text-gray-500 font-montserrat mt-1">
                  View schedule
                </p>
              </Card>

              <Card 
                className="text-center cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/invoice')}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-gray-700 font-lato">
                  New Invoice
                </h4>
                <p className="text-xs text-gray-500 font-montserrat mt-1">
                  Create billing
                </p>
              </Card>
            </div>
          </div>

          {/* Today's Schedule */}
          {todaysAppointments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-700 font-lato">
                  Today's Schedule
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                >
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {todaysAppointments.map((appointment) => (
                  <Card 
                    key={appointment.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/prescriptions/${appointment.patientId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {appointment.patientName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 font-lato">
                            {appointment.patientName}
                          </h4>
                          <p className="text-xs text-gray-600 font-montserrat">
                            {appointment.time} • {appointment.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-montserrat ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-700 font-lato">
                  Upcoming This Week
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                >
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <Card 
                    key={appointment.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/prescriptions/${appointment.patientId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 font-lato">
                          {appointment.patientName}
                        </h4>
                        <p className="text-xs text-gray-600 font-montserrat">
                          {new Date(appointment.date).toLocaleDateString()} • {appointment.time}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          {appointment.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {todaysAppointments.length === 0 && upcomingAppointments.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 font-lato mb-2">
                  No appointments scheduled
                </h3>
                <p className="text-gray-500 font-montserrat text-sm mb-4">
                  Start by creating a new appointment for your patients
                </p>
                <Button onClick={() => navigate('/appointments/new')}>
                  Create Appointment
                </Button>
              </div>
            </Card>
          )}
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default HomePage;
