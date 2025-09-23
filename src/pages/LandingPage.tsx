import React from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import Button from '../components/common/Button';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-b from-primary-300 to-primary-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="absolute top-20 -left-16 w-128 h-80" viewBox="0 0 500 300" fill="none">
            <path d="M0 150C50 50 150 50 250 150C350 250 450 250 500 150V300H0V150Z" fill="rgba(255,255,255,0.1)" />
          </svg>
        </div>

        {/* Top section */}
        <div className="relative z-10 pt-12 px-6 text-center">
          <div className="w-16 h-1.5 bg-primary-500 mx-auto mb-8 rounded-full"></div>
          
          <h1 className="text-sm font-bold text-black mb-2 font-montserrat">
            Smart Healthcare
          </h1>
          
          <h2 className="text-3xl font-bold text-black mb-8 font-montserrat leading-tight">
            Anytime<br />
            Anywhere
          </h2>
        </div>

        {/* Center illustration area */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-80 h-64 bg-white/10 rounded-3xl flex items-center justify-center">
            {/* Healthcare illustration placeholder */}
            <div className="text-6xl">🏥</div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="relative z-10 px-6 pb-12">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-montserrat"
              onClick={() => navigate('/login')}
            >
              Login as Doctor →
            </Button>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-black font-bold text-sm">Medilife Solutions</span>
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default LandingPage;
