import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Stack, Typography, Button } from '../components';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative overflow-hidden">
      {/* Animated background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-primary-300/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-primary-700/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
      </div>

      <Container size="md" className="relative z-10">
        <Stack direction="vertical" spacing={0} className="min-h-screen py-8 sm:py-12">
          {/* Top section */}
          <div className="flex-shrink-0 text-center pt-6 sm:pt-12">
            <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-white/80 mx-auto mb-6 sm:mb-8 rounded-full" />
            
            <Typography variant="body1" weight="semibold" className="text-white/90 mb-2 sm:mb-3 text-sm sm:text-base">
              Smart Healthcare
            </Typography>
            
            <Typography variant="h1" weight="bold" className="text-white mb-4 sm:mb-6 leading-tight text-3xl sm:text-4xl md:text-5xl">
              Anytime
              <br />
              Anywhere
            </Typography>

            <Typography variant="body2" className="text-white/80 max-w-md mx-auto px-4 text-sm sm:text-base">
              Complete dental clinic management at your fingertips
            </Typography>
          </div>

          {/* Center illustration area */}
          <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
            <div className="relative">
              {/* Floating cards effect */}
              <div className="absolute -top-4 -left-4 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl transform rotate-12 animate-bounce" style={{ animationDuration: '3s' }} />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl transform -rotate-12 animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
              
              {/* Main illustration */}
              <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-white/10 backdrop-blur-md rounded-3xl sm:rounded-[2rem] flex flex-col items-center justify-center p-6 sm:p-8 border border-white/20 shadow-2xl">
                <div className="text-6xl sm:text-7xl md:text-8xl mb-4">🦷</div>
                <Typography variant="h5" className="text-white text-center mb-2">
                  DentCharts
                </Typography>
                <Typography variant="body2" className="text-white/70 text-center text-xs sm:text-sm">
                  Mobile Dental Clinic
                </Typography>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex-shrink-0 px-4 pb-6 sm:pb-12">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-6 sm:mb-8 border-2 border-white/40 shadow-2xl">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-primary-700 hover:bg-white/95 shadow-2xl h-14 sm:h-16 text-lg sm:text-xl font-extrabold border-4 border-primary-100"
                onClick={() => navigate('/login')}
                rightIcon={<span className="text-2xl sm:text-3xl font-bold">→</span>}
              >
                Login as Doctor
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 px-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📅</div>
                <Typography variant="caption" className="text-white/90 text-xs">
                  Appointments
                </Typography>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">👥</div>
                <Typography variant="caption" className="text-white/90 text-xs">
                  Patients
                </Typography>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💊</div>
                <Typography variant="caption" className="text-white/90 text-xs">
                  Records
                </Typography>
              </div>
            </div>

            {/* Logo */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-white/20">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-primary-600 font-bold text-sm sm:text-base">D</span>
                </div>
                <Typography variant="body2" weight="semibold" className="text-white text-sm sm:text-base">
                  DentCharts Mobile
                </Typography>
              </div>
            </div>
          </div>
        </Stack>
      </Container>
    </div>
  );
};

export default LandingPage;
