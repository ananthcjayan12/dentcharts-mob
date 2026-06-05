# Graph Report - dentcharts-mob  (2026-05-30)

## Corpus Check
- 161 files · ~167,453 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1459 nodes · 2760 edges · 111 communities (104 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `522dac5d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]

## God Nodes (most connected - your core abstractions)
1. `useClinic()` - 37 edges
2. `ApiClient` - 31 edges
3. `Free Tools Growth Plan for Dent Cue360` - 31 edges
4. `useAuth()` - 27 edges
5. `PaymentService` - 25 edges
6. `AppointmentService` - 25 edges
7. `ApiResponse` - 22 edges
8. `PrescriptionService` - 22 edges
9. `FileUploadService` - 22 edges
10. `DentalChartService` - 21 edges

## Surprising Connections (you probably didn't know these)
- `ConsentFormBuilderPage()` --calls--> `useClinic()`  [EXTRACTED]
  src/pages/ConsentFormBuilderPage.tsx → src/contexts/ClinicContext.tsx
- `WhatsAppManagerPage()` --calls--> `useClinic()`  [EXTRACTED]
  src/pages/WhatsAppManagerPage.tsx → src/contexts/ClinicContext.tsx
- `PrescriptionModal()` --calls--> `useClinic()`  [EXTRACTED]
  src/components/prescription/PrescriptionModal.tsx → src/contexts/ClinicContext.tsx
- `LoginPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/LoginPage.tsx → src/contexts/AuthContext.tsx
- `generateInvoiceHTML()` --calls--> `formatDate()`  [INFERRED]
  src/utils/invoiceTemplates.ts → src/components/orthodontic/OrthodonticTrackerPanel.tsx

## Communities (111 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (49): useAddOrthodonticLedgerEntry(), useCreateOrthodonticCase(), useCreateOrthodonticPayout(), useOrthodonticConsultantReport(), useOrthodonticDashboard(), useOrthodonticLedger(), useOrthodonticPayouts(), usePatientOrthodonticSummary() (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (40): browserslist, development, production, dependencies, axios, frappe-js-sdk, @heroicons/react, html2pdf.js (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (17): CreatePrescriptionRequest, PatientHistoryParams, PrescriptionFilters, PrescriptionResponse, UpdatePrescriptionRequest, useCreatePrescription(), usePatientHistory(), usePatientPrescriptions() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (19): emptySettings, TabKey, TABS, WhatsAppManagerPage(), extractData(), WHATSAPP_ENDPOINTS, WhatsAppConversationMessage, WhatsAppConversationMessagesResponse (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (31): ♿ Accessibility, 📚 Additional Resources, Avatar, Badge, Breakpoints, Button, Card, Colors (+23 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (30): For --cluster-only, For git commit hook, For /graphify add, For /graphify explain, For /graphify path, For /graphify query, For native CLAUDE.md integration, For --update (incremental re-extraction) (+22 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (29): **AppointmentsPage.tsx** Changes Required:, Completed ✅, Current State Assessment, Data Synchronization, Error Handling Strategy, For Developers, For Users, Form Validation Strategy (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (27): Authentication Flow, Building for Production, Colors, Component Architecture (DRY Principles), Components, Contributing, 🏥 Core Functionality, Dashboard Features (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (23): ClinicContext, ClinicContextType, ClinicProvider(), ClinicProviderProps, useClinic(), usePatients(), CreateInvoiceModal(), CreateInvoiceModalProps (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (15): ConsentRecord, ConsentTemplate, ConsentTemplatesResponse, SharedConsentPayload, consentTemplateSource, LocalConsentEntry, LocalConsentLanguage, LocalConsentSection (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (26): 1. **Component Reusability**, 1. **HTTP Error Handling**, 1. **Layered Architecture**, 2. **Custom Hooks Pattern**, 2. **Technology Stack Integration**, 2. **User Feedback**, 3. **DRY Principles**, API Client Configuration (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (15): PageAccessGuard(), PageAccessGuardProps, ClinicSelectorProps, SidebarProps, ProtectedRoute(), ProtectedRouteProps, AuthContext, AuthProviderProps (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (21): ApiError, AppointmentFilters, AvailableSlot, AvailableSlotsResponse, CancelAppointmentRequest, ClinicConsultant, ClinicConsultantsResponse, ClinicPractitionerSchedule (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (24): 1. **Complete API Infrastructure**, 2. **Type System Overhaul**, 3. **Service Layer (6 Complete Modules)**, 4. **React Query Integration**, 5. **Custom Hooks (25+ Hooks)**, 6. **Error Handling & User Experience**, 7. **Updated Architecture**, API Endpoints Covered (40+ endpoints) (+16 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (7): API_CONFIG, API_ENDPOINTS, ApiClient, ApiError, ApiResponse, practitionerService, publicService

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (10): CardProps, InputField, InputFieldProps, useClinicProfile(), BrandingTab(), TemplateFormState, InvoiceTab(), NotificationsTab() (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.19
Nodes (19): useAddToTodaysQueue(), useAppointmentActions(), useAppointmentCalendar(), useAppointments(), useAppointmentsByDate(), useAppointmentsDashboard(), useAppointmentStats(), useAvailableSlots() (+11 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (23): Acknowledgments, Available Scripts, Colors, Components, Contributing, 🏥 Core Functionality, DentCharts - Clinic Management System, Design System (+15 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (14): BottomNavProps, TopBarProps, useDeletePatient(), usePatient(), usePatientActions(), usePatientsComplete(), usePatientsForSelect(), usePatientStats() (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (5): FileCategory, FileResponse, ListFilesParams, UploadFileRequest, FileUploadService

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (19): ADULT_LOWER, ADULT_UPPER, ConditionHistoryEntry, DentalChartProps, MIXED_LOWER, MIXED_UPPER, ModalMode, PEDIATRIC_LOWER (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (4): AppointmentResponse, AppointmentActions(), AppointmentActionsProps, AppointmentService

### Community 22 - "Community 22"
Cohesion: 0.10
Nodes (20): 11. Rollout Plan, 14. Recommended Decision, 16. Final Note, 1. Executive Summary, 2. Why This Strategy Fits Dent Cue360, 3. Current Frontend Observations, 5. SEO Research Notes and Source Quality, 6. The 6 Recommended Tools (+12 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (4): CreateInvoiceRequest, InvoiceResponse, PaymentSummary, PaymentService

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (10): ClinicPractitionerPermissionsResponse, LoginRequest, LoginResponse, PractitionerProfile, AuthService, setActiveClinic(), setStoredToken(), setStoredUserData() (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (18): API connection issues, Auto Deploy, Build fails, Container won't start, Coolify Configuration, DentCharts Mobile - Docker Deployment Guide, Deploy to Coolify, Environment Variables (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (8): CreatePatientRequest, PaginatedResponse, PaginationParams, PatientFilters, PatientResponse, PatientSearchParams, UpdatePatientRequest, PatientService

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (15): InvoiceFilters, useCreateInvoice(), useDeleteInvoice(), useInvoices(), useOverdueInvoices(), usePatientInvoices(), usePatientPaymentsComplete(), usePaymentActions() (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.19
Nodes (12): invalidateQueriesHelper, mutationKeys, queryClient, queryKeys, QueryProvider(), QueryProviderProps, FileUploadModal(), FileUploadModalProps (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+9 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (9): useAddCondition(), useAddProcedure(), useDentalChartActions(), useExportDentalChart(), useRemoveCondition(), useRemoveProcedure(), useSaveDentalChart(), useUpdateCondition() (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (11): PortalProps, useProcedures(), CreateProcedureData, DeleteProcedureData, OverrideProcedureData, proceduresService, CreateCustomProcedureModal(), CreateCustomProcedureModalProps (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.20
Nodes (12): CreateProcedureModal(), useConditions(), Condition, conditionsService, CreateConditionData, DeleteConditionData, OverrideConditionData, ConditionsTab() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (13): DoctorOption, DOSAGE_CONDITIONS, MedicalHistory, PrescriptionModal(), PrescriptionModalProps, TIMING_FIELDS, CreateMedicineData, medicineService (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (13): PatientSummaryModal(), PatientSummaryModalProps, BillingEntry, CaseDiaryEntry, escapeHtml(), generatePatientSummaryHTML(), OrthodonticSummaryData, PatientSummaryPrintData (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (13): CreateProcedureModalProps, SelectedItem, buildTreatmentItemKey(), ConditionCatalogItem, ConditionOption, createClientId(), DEFAULT_PROCEDURE_OPTIONS, getConditionOptions() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.16
Nodes (9): ImageViewerModalProps, useAppointment(), dedupeFilesById(), extractMedicationTag(), fetchPatientContextFiles(), mapMedicationForPrint(), parseFrequencyParts(), stripMedicationTags() (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (8): ConsentSection, ConsentPlaceholderContext, dedupeRepeatedParagraphs(), escapeHtml(), hydrateConsentSections(), renderSectionHtml(), replaceAllPlain(), replaceConsentPlaceholders()

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (15): 1. Login Flow Changes, 2. Clinic Switching, 3. API Calls - Adding Clinic Parameter, 4. Patient Creation Flow, 5. List Views - Clinic Filtering, 6. Error Handling, Change:, Change: (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (10): buildPractitionerLookup(), extractPaymentTypeFromInvoice(), fetchClinicalRecordsForPatient(), normalizeBloodGroup(), normalizeDoctorName(), normalizePaymentType(), parseMedicalHistory(), PatientSummaryService (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.23
Nodes (8): ConsultantPayoutReport, useConsultantPayoutReport(), useDashboardStats(), FinancialDashboardPage(), CollectionSummaryParams, ConsultantPayoutParams, dashboardService, DashboardStatsParams

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (9): ButtonProps, useMedicines(), CreateCustomMedicineModal(), CreateCustomMedicineModalProps, DOSAGE_FORMS, DOSAGE_FORMS, EditTemplateMedicineModal(), EditTemplateMedicineModalProps (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.24
Nodes (10): clearAllStoredData(), clearClinicData(), clearSessionCookies(), clearStoredToken(), clearStoredUserData(), getSessionExpiry(), getStoredToken(), getStoredUserData() (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.15
Nodes (4): ApiResponse, SendPaymentReminderRequest, SharePrescriptionRequest, UpdatePaymentRequest

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (11): Appendix A: Complete API Endpoint List, Appendix B: Code Examples, Database Schema Changes, Integration Tests, Migration Patches, Multi-Clinic (Multi-Tenancy) Implementation Guide, React Native Complete Example, Support (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.26
Nodes (10): DataExportConfig, dataExportService, ExportCsvPayload, ExportCsvResponse, ExportPractitionerOption, ExportTypeKey, ExportTypeOption, DataExportSettingsTab() (+2 more)

### Community 47 - "Community 47"
Cohesion: 0.20
Nodes (7): colorClasses, Divider(), DividerProps, Typography(), Stack(), StackProps, LoginPage()

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (7): anesthesiaPresets, ConditionProcedureRow, ConsentFormBuilderPage(), MedicalHistorySummaryItem, titleCase(), toDisplayName(), toothNumberPresets

### Community 49 - "Community 49"
Cohesion: 0.20
Nodes (10): useCreatePatient(), NewPatientPage(), Appointment, AuthContextType, Invoice, InvoiceItem, Patient, Prescription (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (11): 10. Create Prescription API (Modified), 1. Login API (Modified), 2. Switch Clinic API (New), 3. Get Patients API (Modified), 4. Create Patient API (Modified), 5. Create Appointment API (Modified), 6. Get Appointments API (Modified), 7. Create Invoice API (Modified) (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.25
Nodes (6): ActionDropdownProps, Grid(), GridProps, getColor(), getSpacing(), Theme

### Community 52 - "Community 52"
Cohesion: 0.31
Nodes (6): useCreateAppointment(), useDebounce(), usePractitioners(), NewAppointmentPage(), findNextAvailableSlotTime(), normalizeToHHMMSS()

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (6): APIError, handleAPIError(), isNetworkError(), isRetryableError(), retryWithBackoff(), showErrorToast()

### Community 54 - "Community 54"
Cohesion: 0.36
Nodes (9): RegisterRequest, useAuth(), useAuthActions(), useLogin(), useLogout(), useProfile(), useRegister(), useUpdateProfile() (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.20
Nodes (9): Additional Notes, Contact, DentCharts Clinic Management - API Documentation, Implementation Priority, Pagination, Rate Limiting, Table of Contents, Testing (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (7): downloadPrescriptionPDF(), escapeHtml(), formatDoctorName(), generatePrescriptionHTML(), hasDisplayValue(), printPrescription(), renderMedicationRows()

### Community 57 - "Community 57"
Cohesion: 0.22
Nodes (8): event, info, description, name, _postman_id, schema, item, variable

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (9): 6.1 Tool 1: Interactive Tooth Number Chart, CTA Strategy, Measurement Targets, SEO Signal, Success Metrics, Summary, What We Will Build, Why It Is a Lead Magnet (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.22
Nodes (9): 6.2 Tool 2: Dental Cost Calculator Hub, CTA Strategy, Measurement Targets, SEO Signal, Success Metrics, Summary, What We Will Build, Why It Is a Lead Magnet (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.22
Nodes (9): 6.3 Tool 3: Braces / Clear Aligner EMI Calculator, CTA Strategy, Measurement Targets, SEO Signal, Success Metrics, Summary, What We Will Build, Why It Is a Lead Magnet (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.22
Nodes (9): 6.4 Tool 4: Free Dental Invoice Generator, CTA Strategy, Measurement Targets, SEO Signal, Success Metrics, Summary, What We Will Build, Why It Is a Lead Magnet (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.22
Nodes (9): 6.5 Tool 5: Dental Treatment Plan Generator, CTA Strategy, Measurement Targets, SEO Signal, Success Metrics, Summary, What We Will Build, Why It Is a Lead Magnet (+1 more)

### Community 63 - "Community 63"
Cohesion: 0.22
Nodes (9): 6.6 Tool 6: Dental WhatsApp Reminder Template Generator, CTA Strategy, Measurement Targets, SEO Signal, Success Metrics, Summary, What We Will Build, Why It Is a Lead Magnet (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.22
Nodes (8): event, info, description, name, _postman_id, schema, item, variable

### Community 65 - "Community 65"
Cohesion: 0.22
Nodes (5): Container(), ContainerProps, sizeClasses, Flex(), FlexProps

### Community 66 - "Community 66"
Cohesion: 0.25
Nodes (6): InvoicesPage(), generateInvoiceHTML(), InvoiceData, InvoiceItem, InvoiceTemplateId, invoiceTemplates

### Community 67 - "Community 67"
Cohesion: 0.25
Nodes (7): Copilot Agent Instructions (Frontend: dentcharts-mob), Do Not, Implementation Standards, Non-Negotiable Rules, PR/Commit Notes Format, Scope, Ticket Workflow (Required)

### Community 68 - "Community 68"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (7): 3.1 Get All Patients, 3.2 Get Patient by ID, 3.3 Create New Patient, 3.4 Update Patient, 3.5 Delete Patient, 3.6 Search Patients, 3. Patient Management APIs

### Community 71 - "Community 71"
Cohesion: 0.29
Nodes (7): 4.1 Get All Appointments, 4.2 Get Appointment by ID, 4.3 Create New Appointment, 4.4 Update Appointment, 4.5 Cancel Appointment, 4.6 Get Appointments by Date, 4. Appointment Management APIs

### Community 72 - "Community 72"
Cohesion: 0.29
Nodes (7): 6.1 Get Patient Payments, 6.2 Get Payment by ID, 6.3 Create New Invoice/Payment, 6.4 Update Payment Record, 6.5 Get Payment Summary for Patient, 6.6 Send Payment Reminder, 6. Payment/Invoice Management APIs

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (6): alignClasses, colorClasses, defaultElements, TypographyProps, variantClasses, weightClasses

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (4): mockAppointments, mockPatients, mockPrescriptions, mockUsers

### Community 75 - "Community 75"
Cohesion: 0.33
Nodes (6): 5.1 Get Patient Prescriptions, 5.2 Get Prescription by ID, 5.3 Create New Prescription, 5.4 Update Prescription, 5.5 Delete Prescription, 5. Prescription/Medical History APIs

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (6): 1. Run Database Migration, 2. Assign Primary Clinics, 3. Assign Patients to Clinics (Optional), 4. Frontend Update Checklist, For Existing Installations, Migration Guide

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (5): Avatar(), AvatarProps, getInitials(), sizeClasses, statusClasses

### Community 78 - "Community 78"
Cohesion: 0.33
Nodes (5): Badge(), BadgeProps, dotVariantClasses, sizeClasses, variantClasses

### Community 79 - "Community 79"
Cohesion: 0.33
Nodes (4): ClinicPractitionerPermission, PAGE_OPTIONS, PageOption, PATIENT_SCOPE_KEYS

### Community 80 - "Community 80"
Cohesion: 0.40
Nodes (5): 12. Risks and Mitigations, Risk 1: High traffic, low conversion, Risk 2: Tool pages do not rank, Risk 3: Too many tools, not enough quality, Risk 4: Backend creep increases cost

### Community 81 - "Community 81"
Cohesion: 0.40
Nodes (5): 13. Team Roles Suggested, Design, Frontend, Growth / Marketing, Product

### Community 82 - "Community 82"
Cohesion: 0.40
Nodes (5): 15. Source Links, Dental Reference Context, Keyword and Market Research, Low-Cost Hosting / Infrastructure, Search and SEO Implementation

### Community 83 - "Community 83"
Cohesion: 0.40
Nodes (5): 8.1 Organic Traffic Growth, 8.2 Lead Generation, 8.3 Brand Positioning, 8.4 Product Narrative Reinforcement, 8. How Each Tool Helps the Business

### Community 84 - "Community 84"
Cohesion: 0.40
Nodes (5): 1. Always Use Active Clinic, 2. Refresh Data on Clinic Switch, 3. Show Clinic Context to User, 4. Handle Permission Errors Gracefully, Best Practices

### Community 85 - "Community 85"
Cohesion: 0.40
Nodes (5): 1. Child Table for Additional Clinics, 2. Clinic-Specific Settings, 3. Cross-Clinic Reports, 4. Referral System, Future Enhancements

### Community 86 - "Community 86"
Cohesion: 0.40
Nodes (5): 1. New Helper Module: `clinic.py`, 2. Modified API Endpoints, 3. Custom Fields Added, Backend Changes, Modified Files:

### Community 87 - "Community 87"
Cohesion: 0.50
Nodes (4): Autocomplete(), AutocompleteProps, Suggestion, useDebouncedValue()

### Community 88 - "Community 88"
Cohesion: 0.50
Nodes (4): 1.1 Login, 1.2 Logout, 1.3 Register, 1. Authentication APIs

### Community 89 - "Community 89"
Cohesion: 0.50
Nodes (4): 7.1 Upload File, 7.2 Get File, 7.3 Delete File, 7. File Upload APIs

### Community 90 - "Community 90"
Cohesion: 0.50
Nodes (4): 8.1 Get Dashboard Statistics, 8.2 Get Appointment Statistics, 8.3 Get Revenue Statistics, 8. Dashboard/Statistics APIs

### Community 91 - "Community 91"
Cohesion: 0.50
Nodes (4): Custom Methods:, DocTypes to Create:, Frappe-Specific Implementation Notes, Hooks to Implement:

### Community 92 - "Community 92"
Cohesion: 0.50
Nodes (4): Error Handling, Error Response, HTTP Status Codes, Success Response

### Community 93 - "Community 93"
Cohesion: 0.50
Nodes (4): 4.1 Architecture Recommendation, 4.2 Preferred Stack, 4.3 Why This Is Cost Efficient, 4. Recommended Low-Cost Architecture

### Community 94 - "Community 94"
Cohesion: 0.50
Nodes (4): Issue: 403 Permission Error, Issue: Data shows from wrong clinic, Issue: Login doesn't return clinics, Troubleshooting

### Community 96 - "Community 96"
Cohesion: 0.67
Nodes (3): 2.1 Get Doctor Profile, 2.2 Update Doctor Profile, 2. User/Doctor Management APIs

### Community 97 - "Community 97"
Cohesion: 0.67
Nodes (3): Authentication & Authorization, Permissions, Request Headers

### Community 98 - "Community 98"
Cohesion: 0.67
Nodes (3): 10.1 Content Pattern for Every Tool Page, 10.2 Important SEO Note, 10. SEO Implementation Requirements

### Community 99 - "Community 99"
Cohesion: 0.67
Nodes (3): Key Concepts, Overview, What Changed?

### Community 100 - "Community 100"
Cohesion: 0.67
Nodes (3): Architecture, Clinic Resolution Order, Data Model

### Community 101 - "Community 101"
Cohesion: 0.67
Nodes (3): DentalChart(), getTodayDate(), useDentalChart()

## Knowledge Gaps
- **596 isolated node(s):** `_postman_id`, `name`, `description`, `schema`, `item` (+591 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DentalChartService` connect `Community 32` to `Community 40`, `Community 20`, `Community 14`, `Community 30`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `ApiClient` connect `Community 14` to `Community 0`, `Community 33`, `Community 34`, `Community 3`, `Community 8`, `Community 9`, `Community 41`, `Community 40`, `Community 12`, `Community 46`, `Community 20`, `Community 24`, `Community 26`, `Community 31`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useClinic()` connect `Community 8` to `Community 0`, `Community 33`, `Community 66`, `Community 3`, `Community 34`, `Community 37`, `Community 41`, `Community 42`, `Community 15`, `Community 16`, `Community 48`, `Community 52`, `Community 27`, `Community 31`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `_postman_id`, `name`, `description` to the rest of the system?**
  _596 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05628415300546448 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1036036036036036 - nodes in this community are weakly interconnected._