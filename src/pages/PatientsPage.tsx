import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Grid, Stack, Flex, Card, Button, InputField, Typography, Badge, Avatar, Sidebar } from '../components';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import { usePatientsWithSearch, usePatientStats, useUpdatePatient, useDeletePatient } from '../hooks/usePatients';
import { useProfile } from '../hooks/useAuth';
import { Patient } from '../types';
import toast from 'react-hot-toast';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'male' | 'female'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { data: profile } = useProfile();
  const { mutate: updatePatient, isPending: isUpdating } = useUpdatePatient();
  const { mutate: deletePatient, isPending: isDeleting } = useDeletePatient();

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

  // Real API data instead of mock data with pagination
  const filters = selectedFilter !== 'all' ? { sex: selectedFilter } : {};
  const { 
    data: patientsData, 
    isLoading: patientsLoading 
  } = usePatientsWithSearch(
    searchQuery || undefined, 
    { 
      limit_page_length: itemsPerPage, 
      limit_start: (currentPage - 1) * itemsPerPage 
    }, 
    filters
  );

  const { 
    data: patientStats, 
    isLoading: statsLoading 
  } = usePatientStats();

  const isLoading = patientsLoading || statsLoading;
  const filteredPatients = patientsData?.data || [];
  const totalCount = patientsData?.total_count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePatientClick = (patientId: string) => {
    navigate(`/prescriptions/${patientId}`);
  };

  const handleEditPatient = (patient: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking edit
    setEditingPatient({
      patient_id: patient.name,
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      email: patient.email || '',
      mobile: patient.mobile || '',
      address: patient.address || '',
      occupation: patient.occupation || '',
    });
    setShowEditModal(true);
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient) return;

    try {
      await updatePatient(editingPatient);
      setShowEditModal(false);
      setEditingPatient(null);
    } catch (error: any) {
      console.error('Update patient error:', error);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingPatient(null);
  };

  const handleDeletePatient = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePatient(patientId);
    } catch (error: any) {
      console.error('Delete patient error:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen bg-primary-50">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-20">
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

          {/* Patient Table */}
          <Stack spacing={3}>
            <Flex align="center" justify="between">
              <Typography variant="h6" className="text-gray-700 text-sm sm:text-base font-bold">
                Patients ({filteredPatients.length})
              </Typography>
              <Button
                size="sm"
                onClick={() => navigate('/patients/new')}
              >
                + Add Patient
              </Button>
            </Flex>

            {isLoading ? (
              // Loading skeleton
              <Card padding="none">
                {/* Desktop Table Skeleton */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Full Name', 'Email', 'Phone', 'Date Added', 'Location', 'Status', 'Last Visit', 'Doctor', 'Actions'].map((header) => (
                          <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          {Array.from({ length: 9 }).map((_, colIndex) => (
                            <td key={colIndex} className="px-4 py-3">
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Skeleton */}
                <div className="md:hidden p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : filteredPatients.length > 0 ? (
              <Card padding="none">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          <div className="flex items-center gap-1">
                            Full Name
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date Added
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Last Visit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Doctor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredPatients.map((patient) => (
                        <tr 
                          key={patient.name}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handlePatientClick(patient.name)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar 
                                size="sm"
                                name={patient.patient_name || patient.patient_id || patient.name || 'Unknown'}
                                className="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0"
                              />
                              <Typography variant="body2" weight="semibold" className="text-gray-900 text-sm">
                                {patient.patient_name || patient.patient_id || patient.name || 'Unknown Patient'}
                              </Typography>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-600 text-sm">
                              {patient.email || '-'}
                            </Typography>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-600 text-sm">
                              {patient.mobile || '-'}
                            </Typography>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-600 text-sm">
                              {patient.dob ? new Date(patient.dob).toLocaleDateString() : '-'}
                            </Typography>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-600 text-sm">
                              {patient.address?.split(',')[0] || '-'}
                            </Typography>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant="success" size="sm">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                On treatment
                              </span>
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-600 text-sm">
                              {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : '-'}
                            </Typography>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-600 text-sm">
                              {profile?.practitioner_name || profile?.name || 'N/A'}
                            </Typography>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Flex gap={2}>
                              <button
                                onClick={(e) => handleEditPatient(patient, e)}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                title="Edit Patient"
                                disabled={isUpdating || isDeleting}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleDeletePatient(patient.name, e)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete Patient"
                                disabled={isUpdating || isDeleting}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePatientClick(patient.name);
                                }}
                                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                title="View Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </Flex>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  <Stack spacing={2} className="p-3">
                    {filteredPatients.map((patient) => (
                      <Card 
                        key={patient.name}
                        padding="md"
                        hoverable
                        className="cursor-pointer bg-white border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
                        onClick={() => handlePatientClick(patient.name)}
                      >
                        <Flex align="start" gap={3}>
                          <Avatar 
                            size="md" 
                            name={patient.patient_name || patient.patient_id || patient.name || 'Unknown'}
                            className="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0"
                          />
                          
                          <Stack spacing={2} className="flex-1 min-w-0">
                            <div>
                              <Typography variant="body1" weight="semibold" className="text-gray-900 text-sm">
                                {patient.patient_name || patient.patient_id || patient.name || 'Unknown Patient'}
                              </Typography>
                              <Flex align="center" gap={2} className="mt-1">
                                {patient.sex && (
                                  <Badge variant={patient.sex === 'Male' ? 'primary' : 'success'} size="sm" className="text-xs">
                                    {patient.sex}
                                  </Badge>
                                )}
                                {patient.age && (
                                  <Typography variant="caption" className="text-gray-500 text-xs">
                                    Age: {patient.age}
                                  </Typography>
                                )}
                              </Flex>
                            </div>

                            <div className="space-y-1">
                              <Flex align="center" gap={2}>
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <Typography variant="caption" className="text-gray-600 text-xs">
                                  {patient.mobile || 'No phone'}
                                </Typography>
                              </Flex>
                              
                              {patient.email && (
                                <Flex align="center" gap={2}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <Typography variant="caption" className="text-gray-600 text-xs truncate">
                                    {patient.email}
                                  </Typography>
                                </Flex>
                              )}

                              {patient.address && (
                                <Flex align="center" gap={2}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <Typography variant="caption" className="text-gray-600 text-xs truncate">
                                    {patient.address.split(',')[0]}
                                  </Typography>
                                </Flex>
                              )}
                            </div>

                            <Flex align="center" justify="between" className="mt-2">
                              <Badge variant="success" size="sm">
                                <span className="flex items-center gap-1 text-xs">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                  Active
                                </span>
                              </Badge>
                              
                              <Flex gap={2}>
                                <button
                                  onClick={(e) => handleEditPatient(patient, e)}
                                  className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                  title="Edit Patient"
                                  disabled={isUpdating || isDeleting}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => handleDeletePatient(patient.name, e)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Patient"
                                  disabled={isUpdating || isDeleting}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </Flex>
                            </Flex>
                          </Stack>
                        </Flex>
                      </Card>
                    ))}
                  </Stack>
                </div>
                
                {/* Pagination */}
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                  <Flex align="center" justify="between" className="flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2">
                      <Typography variant="caption" className="text-gray-600 text-xs sm:text-sm">
                        Rows per page:
                      </Typography>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <Flex align="center" gap={4} className="flex-col sm:flex-row">
                      <Typography variant="caption" className="text-gray-600 text-xs sm:text-sm">
                        {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} rows
                      </Typography>
                      <Flex gap={1}>
                        <button 
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'hover:bg-gray-200'
                              } ${i > 0 && 'hidden sm:inline-block'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="px-2 hidden sm:inline">...</span>
                            <button 
                              onClick={() => handlePageChange(totalPages)}
                              className="px-2 sm:px-3 py-1 hover:bg-gray-200 rounded text-xs sm:text-sm font-medium hidden sm:block"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                        
                        <button 
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={currentPage === totalPages || totalPages === 0}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </Flex>
                    </Flex>
                  </Flex>
                </div>
              </Card>
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

        {/* Edit Patient Modal */}
        {showEditModal && editingPatient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <Flex align="center" justify="between" className="mb-6">
                  <Typography variant="h5" weight="bold" className="text-gray-900">
                    Edit Patient
                  </Typography>
                  <button
                    onClick={handleCloseEditModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Flex>

                <Stack spacing={4}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="First Name"
                      type="text"
                      value={editingPatient.first_name}
                      onChange={(e) => setEditingPatient({ ...editingPatient, first_name: e.target.value })}
                      placeholder="First name"
                      disabled
                    />
                    <InputField
                      label="Last Name"
                      type="text"
                      value={editingPatient.last_name}
                      onChange={(e) => setEditingPatient({ ...editingPatient, last_name: e.target.value })}
                      placeholder="Last name"
                      disabled
                    />
                  </div>

                  <InputField
                    label="Email"
                    type="email"
                    value={editingPatient.email}
                    onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                    placeholder="patient@email.com"
                  />

                  <InputField
                    label="Mobile"
                    type="tel"
                    value={editingPatient.mobile}
                    onChange={(e) => setEditingPatient({ ...editingPatient, mobile: e.target.value })}
                    placeholder="+1234567890"
                  />

                  <InputField
                    label="Address"
                    type="text"
                    value={editingPatient.address}
                    onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                    placeholder="123 Main Street, City"
                  />

                  <InputField
                    label="Occupation"
                    type="text"
                    value={editingPatient.occupation}
                    onChange={(e) => setEditingPatient({ ...editingPatient, occupation: e.target.value })}
                    placeholder="Software Engineer"
                  />

                  <Flex gap={3} className="mt-6">
                    <Button
                      variant="outline"
                      onClick={handleCloseEditModal}
                      className="flex-1"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleUpdatePatient}
                      className="flex-1"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Patient'}
                    </Button>
                  </Flex>
                </Stack>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default PatientsPage;
