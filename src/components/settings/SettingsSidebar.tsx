import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SettingsSidebar: React.FC = () => {
    const { user } = useAuth();
    const isClinicAdmin = Boolean(user?.permissions?.is_clinic_admin);

    const navItems = [
        { name: 'Profile', path: '/settings/profile', icon: '🏥' },
        { name: 'Procedures', path: '/settings/procedures', icon: '💉' },
        { name: 'Conditions', path: '/settings/conditions', icon: '🦷' },
        { name: 'Branding', path: '/settings/branding', icon: '🎨' },
        { name: 'Invoice', path: '/settings/invoice', icon: '📄' },
        { name: 'Notifications', path: '/settings/notifications', icon: '🔔' },
        { name: 'Social Media', path: '/settings/social', icon: '🔗' },
        ...(isClinicAdmin ? [{ name: 'Roles Settings', path: '/settings/roles', icon: '🛡️' }] : []),
    ];

    return (
        <aside className="w-full md:w-64 bg-white border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
            </div>
            <nav className="flex flex-col p-2 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default SettingsSidebar;
