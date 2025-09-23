import React from 'react';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  title, 
  onBack, 
  showMenu = false, 
  onMenuClick 
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white">
      {onBack ? (
        <button onClick={onBack} className="p-1">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <div className="w-6" />
      )}
      
      <h1 className="text-lg font-bold text-black font-lato text-center flex-1">
        {title}
      </h1>
      
      {showMenu ? (
        <button onClick={onMenuClick} className="p-1">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      ) : (
        <div className="w-6" />
      )}
    </div>
  );
};

export default TopBar;
