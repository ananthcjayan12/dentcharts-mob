import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Grid, Stack, Flex, Card, Button, InputField, Typography, Badge, Avatar, Sidebar } from '../components';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import { usePatientsWithSearch, usePatientStats } from '../hooks/usePatients';
import { Patient } from '../types';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'male' | 'female'>('all');

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
        break;
    }
  };

  // Real API data instead of mock data
  const filters = selectedFilter !== 'all' ? { sex: selectedFilter } : {};
  const { 
    data: patientsData, 
    isLoading: patientsLoading 
  } = usePatientsWithSearch(
    searchQuery || undefined, 
    { limit_page_length: 50, limit_start: 0 }, 
    filters
  );

  const { 
    data: patientStats, 
    isLoading: statsLoading 
  } = usePatientStats();

  const isLoading = patientsLoading || statsLoading;
  const filteredPatients = patientsData?.data || [];

  const handlePatientClick = (patientId: string) => {
    navigate(`/prescriptions/${patientId}`);
  };

  return (
    <div className="flex min-h-screen bg-primary-50">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <TopBar 
          title="Patients"
          onBack={() => navigate('/home')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 lg:pb-4 flex-1" style={{ height: 'calc(100vh - 60px)' }}>
        <Container size="xl">
          <Stack spacing={6} className="py-4 sm:py-6">
          {/* Search and Filter */}
          <Card padding="md">
            <Stack spacing={4}>
              <InputField
                label="Search Patients"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or phone..."
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />

              <Stack spacing={2}>
                <Typography variant="body2" weight="semibold" className="text-gray-700 text-xs sm:text-sm">
                  Filter by Gender
                </Typography>
                <Flex gap={2}>
                  <Button
                    variant={selectedFilter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter('all')}
                    className="flex-1"
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedFilter === 'male' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter('male')}
                    className="flex-1"
                  >
                    Male
                  </Button>
                  <Button
                    variant={selectedFilter === 'female' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter('female')}
                    className="flex-1"
                  >
                    Female
                  </Button>
                </Flex>
              </Stack>
            </Stack>
          </Card>

          {/* Patient List */}
          <Stack spacing={3}>
            <Flex align="center" justify="between">
              <Typography variant="h6" className="text-gray-700 text-sm sm:text-base font-bold">
                Patients ({filteredPatients.length})
              </Typography>
              <Button
                size="sm"
                onClick={() => navigate('/patients/new')}
              >
                Add Patient
              </Button>
            </Flex>

            {isLoading ? (
              // Loading skeleton
              <Stack spacing={3}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Card key={index} padding="md" hoverable>
                    <Flex align="center" gap={4}>
                      <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                      <Stack spacing={1} className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      </Stack>
                      <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            ) : filteredPatients.length > 0 ? (
              <Stack spacing={2}>
                {filteredPatients.map((patient) => (
                  <Card 
                    key={patient.name}
                    padding="md"
                    hoverable
                    className="cursor-pointer bg-white border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
                    onClick={() => handlePatientClick(patient.name)}
                  >
                    <Flex align="center" gap={4}>
                      <Avatar 
                        size="lg" 
                        name={patient.patient_name || patient.patient_id || patient.name || 'Unknown'}
                        className="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0"
                      />
                      
                      <Stack spacing={1} className="flex-1 min-w-0">
                        <Typography variant="body1" weight="semibold" className="text-gray-900 text-sm">
                          {patient.patient_name || patient.patient_id || patient.name || 'Unknown Patient'}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600 text-xs">
                          {patient.mobile || 'No phone'} • {patient.email || 'No email'}
                        </Typography>
                        <Flex align="center" gap={2} className="flex-wrap">
                          <Badge variant="gray" size="sm" className="text-xs">
                            ID: {patient.name}
                          </Badge>
                          {patient.age && (
                            <Badge variant="gray" size="sm" className="text-xs">
                              Age: {patient.age}
                            </Badge>
                          )}
                          {patient.sex && (
                            <Badge variant={patient.sex === 'Male' ? 'primary' : 'success'} size="sm" className="text-xs">
                              {patient.sex}
                            </Badge>
                          )}
                        </Flex>
                      </Stack>
                      
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Card padding="lg">
                <Stack spacing={3} align="center" className="text-center py-4 sm:py-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <Typography variant="body2" className="text-gray-500 text-xs sm:text-sm">
                    No patients found matching your search
                  </Typography>
                </Stack>
              </Card>
            )}
          </Stack>

          {/* Statistics */}
          <Card padding="md">
            <Stack spacing={4}>
              <Typography variant="h6" className="text-gray-700 text-sm sm:text-base font-bold">
                Patient Statistics
              </Typography>
              <Grid cols={{ xs: 2, sm: 2, md: 4 }} gap={4}>
                <Stack spacing={1} align="center" className="text-center">
                  <Typography variant="h3" className="text-primary-600 text-xl sm:text-2xl font-bold">
                    {isLoading ? '...' : (patientStats?.totalPatients || 0)}
                  </Typography>
                  <Typography variant="caption" className="text-gray-600 text-xs">
                    Total Patients
                  </Typography>
                </Stack>
                <Stack spacing={1} align="center" className="text-center">
                  <Typography variant="h3" className="text-success-600 text-xl sm:text-2xl font-bold">
                    {isLoading ? '...' : filteredPatients.filter(p => p.sex === 'Male').length}
                  </Typography>
                  <Typography variant="caption" className="text-gray-600 text-xs">
                    Male
                  </Typography>
                </Stack>
                <Stack spacing={1} align="center" className="text-center">
                  <Typography variant="h3" className="text-danger-600 text-xl sm:text-2xl font-bold">
                    {isLoading ? '...' : filteredPatients.filter(p => p.sex === 'Female').length}
                  </Typography>
                  <Typography variant="caption" className="text-gray-600 text-xs">
                    Female
                  </Typography>
                </Stack>
                <Stack spacing={1} align="center" className="text-center">
                  <Typography variant="h3" className="text-warning-600 text-xl sm:text-2xl font-bold">
                    {isLoading ? '...' : filteredPatients.length}
                  </Typography>
                  <Typography variant="caption" className="text-gray-600 text-xs">
                    Filtered Results
                  </Typography>
                </Stack>
              </Grid>
            </Stack>
          </Card>
        </Stack>
      </Container>
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default PatientsPage;
