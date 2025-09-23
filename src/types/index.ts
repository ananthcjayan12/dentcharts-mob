export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'patient';
  avatar?: string;
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
  medicalHistory: {
    diabetic: boolean;
    bloodPressure: 'Normal' | 'High' | 'Low' | 'Moderate High';
    cardiacHistory: boolean;
    allergies: boolean;
    familyHeartDisease: boolean;
    covidVaccinated: boolean;
    occupation: string;
  };
  avatar?: string;
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
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string;
  medications: string[];
  investigations: string[];
  notes?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
