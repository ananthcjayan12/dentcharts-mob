import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

const MobileContainer: React.FC<MobileContainerProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`mobile-container w-full max-w-sm mx-auto bg-white shadow-xl relative overflow-hidden
      lg:max-w-none lg:mx-0 lg:shadow-none lg:bg-transparent ${className}`}
    >
      {children}
    </div>
  );
};

export default MobileContainer;
