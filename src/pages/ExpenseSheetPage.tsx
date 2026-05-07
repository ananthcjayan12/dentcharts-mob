import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Card, Container, Typography } from '../components';
import BottomNav from '../components/common/BottomNav';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';
import ExpenseSheetSection from '../components/financial/ExpenseSheetSection';
import { useClinic } from '../contexts/ClinicContext';

const ExpenseSheetPage: React.FC = () => {
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'appointments':
        navigate('/appointments');
        break;
      case 'new-appointment':
        navigate('/appointments/new');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        navigate('/home');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 lg:pl-20">
        <TopBar title="Expense Sheet" showClinicSelector />

        <Container size="xl">
          <div className="space-y-6 py-6 pb-24">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Typography variant="h4" className="mb-1 text-gray-900 font-extrabold tracking-tight">
                  Expense Sheet
                </Typography>
                <Typography variant="body2" className="text-gray-500 font-medium">
                  Track monthly and FY expenses with recurrence rules, invoice-driven rows, and contribution breakdowns.
                </Typography>
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
                <Button variant="outline" size="sm" onClick={() => navigate('/financial-dashboard')}>
                  Back To Financials
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/financial-dashboard/orthodontic')}>
                  Open Orthodontic Dashboard
                </Button>
              </div>
            </div>

            <Card className="border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">Current Scope</div>
                  <div className="mt-2 text-lg font-extrabold text-gray-900">{clinicId || 'Active clinic'}</div>
                  <div className="mt-1 text-sm font-medium text-gray-600">
                    Manual expenses can be added here, while system-generated rows remain invoice-derived and read-only.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">Page Focus</div>
                  <div className="mt-1 text-sm font-semibold text-gray-800">
                    Separate operational expense workflow outside the main finance overview.
                  </div>
                </div>
              </div>
            </Card>

            <ExpenseSheetSection clinicId={clinicId} />
          </div>
        </Container>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default ExpenseSheetPage;
