// Mock data for development and testing

export const mockUsers = [
  {
    id: '1',
    name: 'Dr Pooja Satheesh',
    email: 'pooja@smilecraft.com',
    phone: '+919400475408',
    role: 'doctor' as const,
    avatar: '/api/placeholder/100/100'
  }
];

export const mockPatients = [
  {
    id: 'P0001',
    name: 'Sample Patient Name',
    age: 33,
    gender: 'Male' as const,
    dateOfBirth: '29 Aug 1989',
    phone: '+919400475408',
    email: 'patient@example.com',
    address: '21, Block -C, Road 132. Gulshan, Dhaka - 1211',
    medicalHistory: {
      diabetic: true,
      bloodPressure: 'Moderate High' as const,
      cardiacHistory: false,
      allergies: false,
      familyHeartDisease: false,
      covidVaccinated: true,
      occupation: 'Software Developer'
    },
    avatar: '/api/placeholder/100/100'
  },
  {
    id: 'P0002',
    name: 'John Doe',
    age: 45,
    gender: 'Male' as const,
    dateOfBirth: '15 Mar 1979',
    phone: '+918765432109',
    email: 'john.doe@example.com',
    address: 'Krishna Nagar, Kollam - 691001',
    medicalHistory: {
      diabetic: false,
      bloodPressure: 'Normal' as const,
      cardiacHistory: false,
      allergies: true,
      familyHeartDisease: true,
      covidVaccinated: true,
      occupation: 'Teacher'
    },
    avatar: '/api/placeholder/100/100'
  },
  {
    id: 'P0003',
    name: 'Sarah Wilson',
    age: 28,
    gender: 'Female' as const,
    dateOfBirth: '12 Jun 1997',
    phone: '+919876543210',
    email: 'sarah.wilson@example.com',
    address: 'Marine Drive, Kochi - 682031',
    medicalHistory: {
      diabetic: false,
      bloodPressure: 'Normal' as const,
      cardiacHistory: false,
      allergies: false,
      familyHeartDisease: false,
      covidVaccinated: true,
      occupation: 'Designer'
    },
    avatar: '/api/placeholder/100/100'
  },
  {
    id: 'P0004',
    name: 'Michael Brown',
    age: 52,
    gender: 'Male' as const,
    dateOfBirth: '03 Nov 1972',
    phone: '+917654321098',
    email: 'michael.brown@example.com',
    address: 'MG Road, Thiruvananthapuram - 695001',
    medicalHistory: {
      diabetic: true,
      bloodPressure: 'High' as const,
      cardiacHistory: true,
      allergies: false,
      familyHeartDisease: true,
      covidVaccinated: true,
      occupation: 'Manager'
    },
    avatar: '/api/placeholder/100/100'
  },
  {
    id: 'P0005',
    name: 'Emma Davis',
    age: 38,
    gender: 'Female' as const,
    dateOfBirth: '22 Sep 1987',
    phone: '+916543210987',
    email: 'emma.davis@example.com',
    address: 'Fort Road, Thrissur - 680001',
    medicalHistory: {
      diabetic: false,
      bloodPressure: 'Normal' as const,
      cardiacHistory: false,
      allergies: true,
      familyHeartDisease: false,
      covidVaccinated: true,
      occupation: 'Nurse'
    },
    avatar: '/api/placeholder/100/100'
  }
];

// Smart appointment generator that creates appointments for any date
const generateSmartAppointments = () => {
  const appointments = [];
  const patientNames = ['Sample Patient Name', 'John Doe', 'Sarah Wilson', 'Michael Brown', 'Emma Davis'];
  const patientIds = ['P0001', 'P0002', 'P0003', 'P0004', 'P0005'];
  const appointmentTypes = ['Regular checkup', 'Follow-up', 'Dental cleaning', 'Consultation', 'Treatment', 'Emergency', 'Root canal', 'Extraction', 'Filling'];
  const statuses = ['confirmed', 'pending', 'scheduled'];
  const timeSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'];

  // Generate appointments for the next 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const dateString = date.toISOString().split('T')[0];

    // Generate 2-5 appointments per day (skip some days randomly)
    const shouldHaveAppointments = Math.random() > 0.2; // 80% chance of having appointments
    if (!shouldHaveAppointments && dayOffset > 0) continue;

    const appointmentsPerDay = Math.floor(Math.random() * 4) + 2; // 2-5 appointments
    
    for (let i = 0; i < appointmentsPerDay; i++) {
      const patientIndex = Math.floor(Math.random() * patientNames.length);
      const appointmentId = `${dayOffset}-${i}`;
      
      appointments.push({
        id: appointmentId,
        patientId: patientIds[patientIndex],
        patientName: patientNames[patientIndex],
        date: dateString,
        time: timeSlots[Math.floor(Math.random() * timeSlots.length)],
        type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)] as 'confirmed' | 'pending' | 'scheduled',
        notes: `${appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)]} appointment`
      });
    }
  }

  // Sort appointments by date and time
  return appointments.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });
};

export const mockAppointments = generateSmartAppointments();

export const mockPrescriptions = [
  {
    id: '1',
    patientId: 'P0001',
    date: '2025-01-25',
    medications: [
      'Paracetamol 500mg - 2 times daily',
      'Amoxicillin 250mg - 3 times daily',
      'Ibuprofen 400mg - as needed for pain'
    ],
    investigations: [
      'Activated Partial thromboplastin time (APTT)',
      'Dehydroepiandrosterone sulphate (blood)',
      'CA 125 (Serum)'
    ],
    notes: 'Patient responded well to treatment. Continue medication for 5 days.'
  },
  {
    id: '2',
    patientId: 'P0001',
    date: '2024-12-05',
    medications: [
      'Metronidazole 400mg - 3 times daily',
      'Chlorhexidine mouthwash - twice daily'
    ],
    investigations: [
      'Blood sugar levels',
      'Complete blood count'
    ],
    notes: 'Gum infection treatment. Follow-up in 1 week.'
  }
];
