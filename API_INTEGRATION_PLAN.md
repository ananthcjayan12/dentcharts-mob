# Backend API Integration Implementation Plan

## Overview
This document outlines the step-by-step implementation plan for integrating the Frappe backend APIs into the React mobile clinic app, following React best practices and DRY principles.

## Architecture Strategy

### 1. **Layered Architecture**
```
├── src/
│   ├── api/                    # API Layer
│   │   ├── client.ts          # HTTP client configuration
│   │   ├── types.ts           # API-specific types
│   │   └── services/          # Service modules
│   │       ├── auth.ts
│   │       ├── patient.ts
│   │       ├── appointment.ts
│   │       ├── prescription.ts
│   │       ├── payment.ts
│   │       └── fileUpload.ts
│   ├── hooks/                 # Custom hooks for API operations
│   │   ├── useAuth.ts
│   │   ├── usePatients.ts
│   │   ├── useAppointments.ts
│   │   ├── usePrescriptions.ts
│   │   ├── usePayments.ts
│   │   └── useFileUpload.ts
│   ├── utils/                 # Utility functions
│   │   ├── storage.ts
│   │   ├── validation.ts
│   │   └── formatters.ts
│   └── components/           # Reusable components
│       ├── common/
│       ├── forms/
│       └── feedback/
```

### 2. **Technology Stack Integration**
- **HTTP Client**: Axios with interceptors
- **State Management**: TanStack Query (React Query) for server state
- **Error Handling**: Global error boundary + toast notifications
- **Loading States**: Suspense + skeleton screens
- **Validation**: Zod for runtime type checking
- **Storage**: Secure token storage

## Implementation Phases

### Phase 1: Foundation Setup (Day 1-2)
✅ **Priority: High**

1. **API Infrastructure**
   - Setup HTTP client with base configuration
   - Implement request/response interceptors
   - Add authentication token management
   - Configure error handling

2. **Type System Update**
   - Update existing types to match backend API responses
   - Create API-specific types for requests/responses
   - Add generic API response wrapper types

3. **TanStack Query Setup**
   - Install and configure React Query
   - Setup query client with defaults
   - Add devtools for development

### Phase 2: Authentication Module (Day 3-4)
✅ **Priority: High**

1. **Auth Service Implementation**
   - Replace mock authentication with real API calls
   - Implement login/register/logout endpoints
   - Add profile management
   - Handle session persistence

2. **AuthContext Enhancement**
   - Update to use real API calls
   - Add proper error handling
   - Implement token refresh logic
   - Add loading states

### Phase 3: Core Data Modules (Day 5-8)
✅ **Priority: High**

1. **Patient Management**
   - Create patient service with CRUD operations
   - Implement search and filtering
   - Add custom hooks for patient operations
   - Update PatientsPage and NewPatientPage

2. **Appointment Management**
   - Implement appointment scheduling service
   - Add slot availability checking
   - Create appointment CRUD operations
   - Update AppointmentsPage and NewAppointmentPage

3. **Prescription Management**
   - Create prescription service
   - Implement medical history management
   - Add prescription sharing functionality
   - Update PrescriptionPage

### Phase 4: Payment & File Management (Day 9-10)
✅ **Priority: Medium**

1. **Payment/Invoice System**
   - Implement invoice creation and management
   - Add payment recording functionality
   - Create payment summary views
   - Update InvoicePage

2. **File Upload System**
   - Implement file upload with categories
   - Add file management operations
   - Create file preview components
   - Integrate with patient records

### Phase 5: UI/UX Enhancement (Day 11-12)
✅ **Priority: Medium**

1. **Loading States**
   - Add skeleton screens for all pages
   - Implement progressive loading
   - Add pull-to-refresh functionality

2. **Error Handling**
   - Create global error boundary
   - Add toast notifications
   - Implement retry mechanisms
   - Add offline state handling

### Phase 6: Testing & Optimization (Day 13-14)
✅ **Priority: Medium**

1. **Testing**
   - Unit tests for API services
   - Integration tests for custom hooks
   - E2E tests for critical user flows

2. **Performance Optimization**
   - Implement query optimization
   - Add proper cache invalidation
   - Optimize bundle size
   - Add performance monitoring

## React Best Practices Implementation

### 1. **Component Reusability**
```typescript
// Reusable API components
<DataTable<Patient>
  data={patients}
  loading={isLoading}
  columns={patientColumns}
  onRefresh={refetch}
/>

<FormModal<PatientFormData>
  isOpen={isOpen}
  onSubmit={handleSubmit}
  schema={patientSchema}
  title="Add Patient"
/>
```

### 2. **Custom Hooks Pattern**
```typescript
// Example: usePatients hook
export const usePatients = (filters?: PatientFilters) => {
  const query = useQuery({
    queryKey: ['patients', filters],
    queryFn: () => patientService.getPatients(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createPatient = useMutation({
    mutationFn: patientService.createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries(['patients']);
      toast.success('Patient created successfully');
    },
  });

  return {
    ...query,
    createPatient: createPatient.mutateAsync,
    isCreating: createPatient.isLoading,
  };
};
```

### 3. **DRY Principles**
- Shared API response handling
- Reusable form components
- Common validation schemas
- Standardized error handling
- Consistent loading states

## Configuration Management

### Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_VERSION=v1
REACT_APP_STORAGE_PREFIX=dentcharts_
REACT_APP_SESSION_TIMEOUT=24h
```

### API Client Configuration
```typescript
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Error Handling Strategy

### 1. **HTTP Error Handling**
- 401: Redirect to login
- 403: Show permission denied
- 404: Show not found message
- 500: Show generic error with retry
- Network errors: Show offline message

### 2. **User Feedback**
- Loading indicators for all async operations
- Success messages for CRUD operations
- Clear error messages with actionable steps
- Offline state notifications

## Security Considerations

1. **Token Management**
   - Secure storage of authentication tokens
   - Automatic token refresh
   - Logout on token expiration

2. **Data Validation**
   - Client-side validation before API calls
   - Runtime type checking with Zod
   - Sanitization of user inputs

3. **File Upload Security**
   - File type validation
   - Size limitations
   - Secure file handling

## Performance Optimizations

1. **Caching Strategy**
   - Aggressive caching for static data
   - Background refetching for dynamic data
   - Optimistic updates for better UX

2. **Bundle Optimization**
   - Code splitting by routes
   - Lazy loading of heavy components
   - Tree shaking unused code

3. **Mobile Optimization**
   - Efficient image handling
   - Touch-friendly interactions
   - Minimal network requests

## Migration Timeline

- **Week 1**: Foundation setup + Authentication
- **Week 2**: Core data modules (Patients, Appointments, Prescriptions)
- **Week 3**: Payment/File management + UI/UX enhancements
- **Week 4**: Testing, optimization, and deployment

## Next Steps

1. Start with Phase 1: API Infrastructure setup
2. Implement authentication module with real backend
3. Replace mock data progressively with real API calls
4. Test each module thoroughly before moving to next
5. Deploy incrementally to catch issues early

This plan ensures a systematic, maintainable, and scalable integration while following React best practices and maintaining code quality.