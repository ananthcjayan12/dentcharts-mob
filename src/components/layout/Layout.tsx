import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../common/TopBar';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backPath?: string; // Custom path for back button
}

// A simple layout wrapper that can be extended
const Layout: React.FC<LayoutProps> = ({ children, title, showBack, backPath }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {title && (
        <TopBar
          title={title}
          onBack={showBack ? handleBack : undefined}
          variant="default"
        />
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default Layout;
