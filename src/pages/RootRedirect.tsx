import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';

const RootRedirect: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If user is logged in, redirect to home
        if (user) {
            navigate('/home', { replace: true });
        }
    }, [user, navigate]);

    // Show landing page if not logged in
    return user ? null : <LandingPage />;
};

export default RootRedirect;
