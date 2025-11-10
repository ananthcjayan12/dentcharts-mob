import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
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

  const isLoading = appointmentsLoading || upcomingLoading;
  const todaysAppointments = selectedDateAppointments || [];

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gray-50">
        <TopBar 
          title="Appointments"
          onBack={() => navigate('/home')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 pt-4" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="px-6 space-y-6">
          {/* Date Selector */}
          <div>
            <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg font-montserrat text-sm"
            />
          </div>

          {/* Today's Appointments */}
          <div>
            <h3 className="text-base font-bold text-gray-700 font-lato mb-4">
              Appointments for {new Date(selectedDate).toLocaleDateString()}
            </h3>

            {isLoading ? (
              // Loading skeleton when fetching data
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : todaysAppointments.length > 0 ? (
              <div className="space-y-3">
                {todaysAppointments.map((appointment) => (
                  <Card 
                    key={appointment.appointment_id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="text-sm font-bold text-gray-800 font-lato truncate">
                          {appointment.patient_name}
                        </h4>
                        <p className="text-xs text-gray-600 font-montserrat mt-1">
                          {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} • Consultation
                        </p>
                        <div className="flex items-center mt-2">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                            appointment.status === 'Confirmed' ? 'bg-green-500' :
                            appointment.status === 'Scheduled' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></span>
                          <span className="text-xs text-gray-500 font-montserrat capitalize">
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-montserrat">
                          PID: {appointment.patient_id}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-montserrat text-sm">
                    No appointments scheduled for this date
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Upcoming Appointments */}
          {!isLoading && upcomingAppointments && upcomingAppointments.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-gray-700 font-lato mb-4">
                Upcoming Appointments
              </h3>

              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <Card 
                    key={appointment.appointment_id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="text-sm font-bold text-gray-800 font-lato truncate">
                          {appointment.patient_name}
                        </h4>
                        <p className="text-xs text-gray-600 font-montserrat mt-1">
                          {new Date(appointment.appointment_datetime).toLocaleDateString()} • {new Date(appointment.appointment_datetime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat truncate">
                          Consultation
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-montserrat ${
                          appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
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

          {/* Floating Action Button */}
          <div className="fixed bottom-24 right-6 z-10">
            <button
              onClick={() => navigate('/appointments/new')}
              className="w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default AppointmentsPage;
