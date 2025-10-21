import React from 'react';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  showMenu?: boolean;
  onMenuClick?: () => void;
  variant?: 'default' | 'gradient';
}

const TopBar: React.FC<TopBarProps> = ({ 
  title, 
  onBack, 
  showMenu = false, 
  onMenuClick,
  variant = 'default'
}) => {
  const baseClasses = "flex items-center justify-between p-4 h-14 relative z-10";
  const variantClasses = variant === 'gradient' 
    ? "bg-gradient-to-r from-primary-500 to-green-400 text-white" 
    : "bg-white text-black border-b border-gray-100";

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      {onBack ? (
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 rounded-full hover:bg-black/10 transition-colors duration-200 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <div className="w-9" />
      )}
      
      <h1 className="text-lg font-bold font-lato text-center flex-1 truncate px-2">
        {title}
      </h1>
      
      {showMenu ? (
        <button 
          onClick={onMenuClick} 
          className="p-2 -mr-2 rounded-full hover:bg-black/10 transition-colors duration-200 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      ) : (
        <div className="w-9" />
      )}
    </div>
  );
};

export default TopBar;
