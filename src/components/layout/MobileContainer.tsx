import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

const MobileContainer: React.FC<MobileContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`mobile-container ${className}`}>
      {children}
    </div>
  );
};

export default MobileContainer;
