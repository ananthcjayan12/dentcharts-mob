// API Services - Export all service modules

export { authService } from './auth';
export { patientService } from './patient';
export { appointmentService } from './appointment';
export { prescriptionService } from './prescription';
export { paymentService } from './payment';
export { fileUploadService } from './fileUpload';
export { dentalChartService } from './dentalChart';
export { practitionerService } from './practitioner';
export { dashboardService } from './dashboard';
export { publicService } from './public';
export { medicineService } from './medicine';
export { patientSummaryService } from './patientSummary';
export { orthodonticService } from './orthodontic';
export { clinicProfileService } from './clinicProfile';
export { dataExportService } from './dataExport';

// Re-export types for convenience
export * from '../types';
export { apiClient, API_ENDPOINTS } from '../client';
