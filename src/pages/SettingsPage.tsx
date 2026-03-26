import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import Layout from '../components/layout/Layout';
import ProfileTab from '../components/settings/ProfileTab';
import ProceduresTab from '../components/settings/ProceduresTab';
import ConditionsTab from '../components/settings/ConditionsTab';
import BrandingTab from '../components/settings/BrandingTab';
import InvoiceTab from '../components/settings/InvoiceTab';
import ConsultantsSettingsTab from '../components/settings/ConsultantsSettingsTab';
import NotificationsTab from '../components/settings/NotificationsTab';
import SocialMediaTab from '../components/settings/SocialMediaTab';
import RolesSettingsTab from '../components/settings/RolesSettingsTab';
import DataExportSettingsTab from '../components/settings/DataExportSettingsTab';

const SettingsPage: React.FC = () => {
    return (
        <Layout title="Clinic Settings" showBack backPath="/home">
            <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-gray-50">
                <SettingsSidebar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Routes>
                        <Route path="/" element={<Navigate to="profile" replace />} />
                        <Route path="profile" element={<ProfileTab key="profile" />} />
                        <Route path="procedures" element={<ProceduresTab key="procedures" />} />
                        <Route path="conditions" element={<ConditionsTab key="conditions" />} />
                        <Route path="branding" element={<BrandingTab key="branding" />} />
                        <Route path="invoice" element={<InvoiceTab key="invoice" />} />
                        <Route path="consultants" element={<ConsultantsSettingsTab key="consultants" />} />
                        <Route path="notifications" element={<NotificationsTab key="notifications" />} />
                        <Route path="social" element={<SocialMediaTab key="social" />} />
                        <Route path="roles" element={<RolesSettingsTab key="roles" />} />
                        <Route path="data-export" element={<DataExportSettingsTab key="data-export" />} />
                    </Routes>
                </main>
            </div>
        </Layout>
    );
};

export default SettingsPage;
