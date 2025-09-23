import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

// A simple layout wrapper that can be extended
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

export default Layout;
