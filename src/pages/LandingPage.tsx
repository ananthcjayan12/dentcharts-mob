import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 flex items-center justify-center text-white overflow-hidden relative selection:bg-white/30 p-4 md:p-8 font-sans">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL,GRAD,opsz@300,0,0,24&display=swap');`}
      </style>
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-white/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-primary-600/30 rounded-full blur-3xl pointer-events-none animate-pulse duration-700" style={{ animationDelay: '2s' }}></div>

      <main className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left Section (Hero Texts and Features) */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 order-2 lg:order-1 pt-8 lg:pt-0">
          <div className="space-y-6 max-w-lg lg:max-w-xl">

            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
              <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-white/90 uppercase">Smart Healthcare System</span>
            </div>

            {/* Headline and Subtitle */}
            <div className="flex flex-col items-center lg:items-start space-y-2 lg:space-y-3 mt-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight drop-shadow-sm text-white">
                Dent Cue360
              </h1>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white/90 drop-shadow-sm">
                Care. Simplified. Connected.
              </h2>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-white/80 font-normal leading-relaxed mt-4 lg:mt-5 max-w-sm lg:max-w-md">
              Experience the next generation of dental clinic management solution. Streamlined records, effortless scheduling, and powerful insights at your fingertips.
            </p>
          </div>

          {/* Grid of features */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-sm lg:max-w-md mt-4 lg:mt-5 mx-auto lg:mx-0">
            {[
              { icon: '📅', text: 'Appointments' },
              { icon: '🧾', text: 'Invoices' },
              { icon: '🦷', text: 'Dentcharts' },
              { icon: '🏥', text: 'Queue Mgmt' },
              { icon: '✨', text: 'AI Insights' },
              { icon: '💊', text: 'Prescriptions' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl p-2.5 sm:px-4 sm:py-3 flex items-center gap-3 transition-transform hover:scale-105 duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.05)] cursor-default"
              >
                <span className="text-lg sm:text-xl drop-shadow-sm">{item.icon}</span>
                <span className="text-xs sm:text-sm font-semibold text-white/90">{item.text}</span>
              </div>
            ))}

            <div className="col-span-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl p-2.5 sm:px-4 sm:py-3 flex items-center justify-center gap-3 transition-transform hover:scale-105 duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.05)] cursor-default">
              <span className="text-lg sm:text-xl drop-shadow-sm">📱</span>
              <span className="text-xs sm:text-sm font-semibold text-white/90">Mobile App</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-white/60 font-medium tracking-wide mt-4">
            Powered by Cue360 — Smart Tech Behind Smarter Clinics
          </p>
        </div>

        {/* Right Section (Doctor Portal Card) */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto order-1 lg:order-2">
          {/* Glassmorphic Card container */}
          <div className="bg-white/15 border border-white/30 backdrop-blur-lg rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-14 relative overflow-hidden transition-all hover:scale-[1.02] duration-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] group">

            {/* Subtle inner top-right highlight */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none transform -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150"></div>

            <div className="relative z-10 flex flex-col gap-6 sm:gap-8 justify-center items-center">
              <div className="text-center">
                {/* Tooth Icon Circle */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/30 rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-inner border border-white/40 transform group-hover:-translate-y-2 transition-transform duration-500 backdrop-blur-md">
                  <span className="material-symbols-outlined text-[54px] sm:text-[65px] lg:text-[86px] text-white drop-shadow-md relative leading-none" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
                    dentistry
                  </span>
                </div>

                <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-white drop-shadow-sm">Doctor Portal</h2>
                <p className="text-sm sm:text-base text-white/80 mt-2 font-medium">Access your secure dashboard</p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="group/btn relative w-full sm:w-[85%] mx-auto overflow-hidden rounded-[1rem] sm:rounded-[1.25rem] bg-white text-primary-600 font-bold text-base sm:text-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(255,255,255,0.4)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative py-4 sm:py-5 px-6 flex items-center justify-center gap-2 sm:gap-3">
                  <span>Login as Doctor</span>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default LandingPage;
