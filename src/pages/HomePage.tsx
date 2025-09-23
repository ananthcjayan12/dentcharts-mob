import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MobileContainer from '../components/layout/MobileContainer';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { mockAppointments } from '../data/mockData';
import { Appointment } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');

  // Get today's date and upcoming appointments
  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = mockAppointments
    .filter((apt: Appointment) => apt.date >= today)
    .slice(0, 5);

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

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-b from-primary-300 to-green-200 pb-20">
        <div className="w-16 h-1.5 bg-primary-500 mx-auto pt-6 rounded-full"></div>
        
        {/* Header */}
        <div className="px-6 pt-4 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-black font-lato font-semibold mb-1">
                Welcome Back,
              </p>
              <h1 className="text-xl font-bold text-primary-700 font-lato mb-1">
                {user?.name || 'Dr Pooja Satheesh'}
              </h1>
              <p className="text-xs text-black font-lato">
                Dr Pooja's Smilecraft Dental Clinic<br />
                Ezhupunna
              </p>
            </div>
            <div className="relative">
              <div className="w-16 h-16 bg-white rounded-full overflow-hidden shadow-lg">
                <img 
                  src="/api/placeholder/64/64" 
                  alt="Doctor" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                🔍
              </div>
              <input
                type="text"
                placeholder="find an appointment by patient's name"
                className="w-full pl-10 pr-4 py-3 bg-white rounded-full shadow-light text-sm"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 space-y-6">
          {/* Today's Appointment Card */}
          <Card className="bg-gradient-to-r from-primary-500 to-green-400 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold font-lato mb-1">
                    Today's<br />
                    Appointment
                  </h3>
                  <p className="text-xs opacity-90">25th Dec 2022</p>
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-semibold font-lato mb-1">
                    Dr Pooja Satheesh
                  </h4>
                  <p className="text-xs opacity-90">
                    Chief Dental Surgeon<br />
                    SmileCraft
                  </p>
                </div>
              </div>
            </div>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-white/10 transform rotate-12"></div>
            </div>
          </Card>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center" onClick={() => navigate('/patients')}>
              <div className="text-3xl mb-2">👥</div>
              <h3 className="text-sm font-semibold text-black font-lato">
                My<br />
                Patients
              </h3>
            </Card>

            <Card className="text-center" onClick={() => navigate('/appointments')}>
              <div className="text-3xl mb-2">📅</div>
              <h3 className="text-sm font-semibold text-black font-lato">
                My<br />
                Appointments
              </h3>
            </Card>

            <Card className="text-center" onClick={() => navigate('/prescriptions/P0001')}>
              <div className="text-3xl mb-2">📋</div>
              <h3 className="text-sm font-semibold text-black font-lato">
                My<br />
                Prescriptions
              </h3>
            </Card>

            <Card className="text-center" onClick={() => navigate('/invoice')}>
              <div className="text-3xl mb-2">🧾</div>
              <h3 className="text-sm font-semibold text-black font-lato">
                New<br />
                Invoice
              </h3>
            </Card>
          </div>

          {/* Upcoming Appointments */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-black font-lato">
                Upcoming Appointment
              </h2>
              <div className="flex space-x-2">
                <Button size="sm" className="text-xs px-3 py-1" onClick={() => navigate('/appointments/new')}>
                  Add New
                </Button>
                <Button size="sm" variant="outline" className="text-xs px-3 py-1" onClick={() => navigate('/appointments')}>
                  View All
                </Button>
              </div>
            </div>

            <div className="border-t border-primary-600 pt-2">            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex justify-between items-center py-2">
                  <div className="flex-1">
                    <span className="text-sm text-black font-lato">
                      {new Date(appointment.date).toLocaleDateString()}, {appointment.time}
                    </span>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-sm text-black font-lato">
                      {appointment.patientName}
                    </span>
                  </div>
                  <div className="flex-1 text-right">
                    <Button 
                      size="sm" 
                      variant="primary" 
                      className="text-xs px-3 py-1"
                      onClick={() => navigate(`/prescriptions/${appointment.patientId}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default HomePage;
