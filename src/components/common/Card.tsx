import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const handleClick = onClick ? { onClick, role: 'button', tabIndex: 0 } : {};
  
  return (
    <div
      className={`card ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
      {...handleClick}
    >
      {children}
    </div>
  );
};

export default Card;
