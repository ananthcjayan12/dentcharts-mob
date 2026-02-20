// Updated types to match backend API responses
export type PagePermissionKey =
  | 'home'
  | 'appointments'
  | 'patients'
  | 'prescriptions'
  | 'invoice'
  | 'financial_dashboard'
  | 'whatsapp-manager'
  | 'settings';

export interface UserPermissions {
  is_clinic_admin: boolean;
  allowed_pages: PagePermissionKey[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'patient';
  avatar?: string;
  practitioner_id?: string;
  full_name?: string;
  mobile?: string;
  clinics?: string[];  // List of accessible clinics
  active_clinic?: string;  // Currently selected clinic
  primary_clinic?: string;  // Primary/default clinic
  clinic?: {
    name: string;
    description?: string;
    logo?: string;
    working_hours?: any[];
  };
  permissions: UserPermissions;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  phone: string;
  email?: string;
  address: string;
  medicalHistory?: {
    diabetic: boolean;
    bloodPressure: 'Normal' | 'High' | 'Low' | 'Moderate High';
    cardiacHistory: boolean;
    allergies: boolean;
    familyHeartDisease: boolean;
    covidVaccinated: boolean;
    occupation: string;
  };
  avatar?: string;
  // API fields
  patient_id?: string;
  patient_name?: string;
  sex?: string;
  mobile?: string;
  dob?: string;
  occupation?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  // API fields
  appointment_id?: string;
  patient_id?: string;
  patient_name?: string;
  appointment_datetime?: string;
  duration?: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string;
  medications: string[];
  investigations: string[];
  notes?: string;
  // API fields
  record_id?: string;
  patient_id?: string;
  patient_name?: string;
  posting_date?: string;
  chief_complaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
  status?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchClinic: (clinic: string) => Promise<void>;
  canAccessPage: (pageKey: PagePermissionKey) => boolean;
  isLoading: boolean;
}

// Invoice/Payment types for the existing app
export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'partially-paid';
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}
