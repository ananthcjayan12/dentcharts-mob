import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { usePatientsWithSearch } from '../hooks/usePatients';
import { useDebounce } from '../hooks/useDebounce';
import { useCreateAppointment, useAvailableSlots, useAppointments } from '../hooks/useAppointments';
import { findNextAvailableSlotTime, normalizeToHHMMSS } from '../utils/slotUtils';
import { usePractitioners } from '../hooks/usePractitioners';
import toast from 'react-hot-toast';

const NewAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'date' | 'today'>('today');
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    duration: 30,
    notes: '',
    chief_complaint: ''
  });

  // Track if we've already loaded patient from URL params to prevent infinite loop
  const patientLoadedFromUrl = useRef(false);

  // API hooks
  const debouncedSearchQuery = useDebounce(patientSearchQuery, 500);
  const { data: patientsData, isLoading: patientsLoading } = usePatientsWithSearch(debouncedSearchQuery);
  const { data: practitionersData, isLoading: practitionersLoading } = usePractitioners();
  const { mutate: createAppointment, isPending: isCreating } = useCreateAppointment();

  // Get available slots when date and doctor are selected or when adding to today's queue
  const slotsDate = appointmentType === 'today' ? new Date().toISOString().split('T')[0] : formData.appointment_date;
  // For 'today' we want slots even if practitioner is not yet selected so next-slot logic works
  const shouldFetchSlots = (appointmentType === 'today') || (!!selectedDoctor && appointmentType === 'date' && !!formData.appointment_date);
  const slotsParams: any = { date: slotsDate, duration: formData.duration };
  if (selectedDoctor) slotsParams.practitioner = selectedDoctor;
  const { data: availableSlots, isLoading: slotsLoading, refetch: refetchSlots } = useAvailableSlots(slotsParams, shouldFetchSlots);

  // Get existing appointments for selected date
  const { data: dateAppointmentsData } = useAppointments(
    {},
    {
      date_from: formData.appointment_date,
      date_to: formData.appointment_date,
      practitioner: selectedDoctor,
    }
  );

  const patients = patientsData?.data || [];
  const practitioners = practitionersData?.data || [];
  const slots = availableSlots || [];
  const dateAppointments = dateAppointmentsData?.data || [];

  // Auto-select first practitioner if available
  useEffect(() => {
    if (practitioners.length > 0 && !selectedDoctor) {
      setSelectedDoctor(practitioners[0].name);
    }
  }, [practitioners, selectedDoctor]);

  // Check if patient ID is provided in URL params
  useEffect(() => {
    const rawPatientId = searchParams.get('patientId');
    const dateParam = searchParams.get('date');
    const typeParam = searchParams.get('type');

    // Load patient from URL params only once
    if (rawPatientId && !patientLoadedFromUrl.current) {
      const patientId = decodeURIComponent(rawPatientId);

      // If we have patients loaded, try to find the patient
      if (patients.length > 0) {
        const patient = patients.find(p =>
          p.name === patientId || p.patient_id === patientId || (p.patient_name || p.name || '').toLowerCase().includes(patientId.toLowerCase())
        );
        if (patient) {
          setSelectedPatient(patient);
          setShowPatientList(false);
          setPatientSearchQuery(patient.patient_name || patient.name || '');
          patientLoadedFromUrl.current = true;
        }
      } else if (!patientSearchQuery) {
        // If no patients loaded yet and search not triggered, trigger a search for this patient ID
        setPatientSearchQuery(patientId);
        setShowPatientList(true);
      }
    }

    if (typeParam === 'today') {
      setAppointmentType('today');
    } else if (dateParam) {
      setFormData(prev => ({ ...prev, appointment_date: dateParam }));
      setAppointmentType('date');
    }
  }, [searchParams, patients, patientSearchQuery]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    if (appointmentType === 'date' && !formData.appointment_date) {
      toast.error('Please select a date');
      return;
    }

    let appointment_time = formData.appointment_time;

    // Ensure we have fresh slots for the selected practitioner/date before computing next slot
    let freshSlots = slots;
    if (refetchSlots) {
      try {
        const refetchResult = await refetchSlots();
        freshSlots = refetchResult?.data || slots;
      } catch (e) {
        freshSlots = slots;
      }
    }

    if (appointmentType === 'today' && !appointment_time) {
      const next = findNextAvailableSlotTime(freshSlots, new Date());
      if (next) {
        appointment_time = next;
      } else {
        toast.error('No available slots found for today.');
        return;
      }
    }

    if (appointmentType === 'date' && !appointment_time) {
      toast.error('Please select a time slot');
      return;
    }

    // Normalize appointment_time to HH:MM:SS (handle inputs like '09', '09:00', '09:00:00', or malformed longer strings)
    // NOTE: return undefined when no time provided so we don't fallback to 09:00 automatically.
    const normalizedTime = normalizeToHHMMSS(appointment_time);

    if (!normalizedTime) {
      toast.error('Invalid appointment time');
      return;
    }

    const appointmentData: any = {
      patient_id: selectedPatient.patient_id || selectedPatient.name,
      practitioner: selectedDoctor,
      appointment_date: appointmentType === 'today'
        ? new Date().toISOString().split('T')[0]
        : formData.appointment_date,
      appointment_time: normalizedTime,
      duration: formData.duration,
      notes: formData.notes || undefined,
      chief_complaint: formData.chief_complaint || undefined,
    };

    // Debug log to inspect slots and payload when no time selected or unexpected behavior
    // (development-only) — will help determine whether client computed a time
    // eslint-disable-next-line no-console
    console.debug('NewAppointment - freshSlots:', freshSlots, 'appointmentData:', appointmentData);

    // If a specific slot was selected and the API provided occupancy info in slots,
    // warn the user before booking when existing appointments > 0.
    if (appointmentType === 'date' && formData.appointment_time) {
      const selectedSlot = slots.find((s: any) => s.time === formData.appointment_time || s.time.startsWith(formData.appointment_time));
      if (selectedSlot && typeof selectedSlot.existing_appointments !== 'undefined' && selectedSlot.existing_appointments > 0) {
        const confirmMsg = `This slot already has ${selectedSlot.existing_appointments} existing appointment(s). Do you want to continue and book anyway?`;
        if (!window.confirm(confirmMsg)) {
          return;
        }
      }
    }

    createAppointment(appointmentData, {
      onSuccess: (res: any) => {
        // Backend may return occupancy/warning fields; if present, surface a final warning
        const data = res?.data || res;
        if (data?.slot_existing_appointments && data.slot_existing_appointments > 0) {
          const ok = window.confirm(`Note: This slot had ${data.slot_existing_appointments} existing booking(s). Proceed?`);
          if (!ok) return;
        }

        toast.success('Appointment created successfully!');
        if (sendWhatsApp) {
          toast.success('WhatsApp confirmation sent!');
        }
        navigate('/appointments');
      },
      onError: (error) => {
        console.error('Error creating appointment:', error);
        toast.error('Failed to create appointment. Please try again.');
      }
    });
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-xl w-full sm:max-w-2xl min-h-screen sm:min-h-0 sm:my-8 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 pr-4">
            Search and book appointments
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-4 sm:px-6 py-4 max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Search Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="relative">
              <input
                type="text"
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value);
                  if (e.target.value) setShowPatientList(true);
                }}
                onClick={() => setShowPatientList(true)}
                placeholder="Search patient by name, ID, or phone"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={() => navigate('/patients/new')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Patient</span>
            </button>
          </div>

          {/* Patient List Table */}
          {showPatientList && (
            <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Full Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Mobile Number</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Doctor</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patientsLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Loading patients...
                        </td>
                      </tr>
                    ) : patients.length > 0 ? (
                      patients.slice(0, 5).map((patient) => (
                        <tr key={patient.patient_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{patient.patient_name || patient.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{patient.address?.split(',')[0] || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{patient.mobile}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {practitioners.length > 0 ? practitioners[0].practitioner_name : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowPatientList(false);
                                setPatientSearchQuery(patient.patient_name || patient.name);
                              }}
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <p className="text-gray-500">No patients found</p>
                            <button
                              onClick={() => navigate('/patients/new')}
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Create New Patient
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden bg-white">
                {patientsLoading ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    Loading patients...
                  </div>
                ) : patients.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {patients.slice(0, 5).map((patient) => (
                      <div key={patient.patient_id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">
                              {patient.patient_name || patient.name}
                            </h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p>📍 {patient.address?.split(',')[0] || 'N/A'}</p>
                              <p>📱 {patient.mobile}</p>
                              <p>👨‍⚕️ {practitioners.length > 0 ? practitioners[0].practitioner_name : '-'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowPatientList(false);
                              setPatientSearchQuery(patient.patient_name || patient.name);
                            }}
                            className="ml-3 px-3 py-1.5 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-gray-500 mb-3">No patients found</p>
                    <button
                      onClick={() => navigate('/patients/new')}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create New Patient
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Doctor Selection & Appointment Settings */}
          {selectedPatient && (
            <div className="space-y-6">
              {/* Select Doctor */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">Select Doctor</h3>
                {practitionersLoading ? (
                  <div className="text-sm text-gray-500">Loading doctors...</div>
                ) : practitioners.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {practitioners.map((practitioner) => (
                      <button
                        key={practitioner.name}
                        onClick={() => setSelectedDoctor(practitioner.name)}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${selectedDoctor === practitioner.name
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {practitioner.practitioner_name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No practitioners available</div>
                )}
              </div>

              {/* Reason for Visit / Chief Complaint */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">Reason for Visit</h3>
                <div className="space-y-3">
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap gap-2">
                    {['General Checkup', 'Tooth Pain', 'Cleaning', 'Root Canal', 'Extraction', 'Filling', 'Crown/Bridge', 'Orthodontics', 'Consultation', 'Follow-up'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => handleInputChange('chief_complaint', reason)}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${formData.chief_complaint === reason
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  {/* Custom input */}
                  <input
                    type="text"
                    value={formData.chief_complaint}
                    onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
                    placeholder="Or type a custom reason..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Set Appointment */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">Set Appointment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setAppointmentType('date')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${appointmentType === 'date'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">Select Date</span>
                  </button>

                  <button
                    onClick={() => setAppointmentType('today')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${appointmentType === 'today'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">Add to Todays Queue</span>
                  </button>
                </div>

                {appointmentType === 'date' && (
                  <div className="mt-4 space-y-4">
                    <input
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    {/* Time Slot Selection */}
                    {formData.appointment_date && selectedDoctor && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Select Time Slot</h4>
                        {slotsLoading ? (
                          <div className="text-sm text-gray-500">Loading available slots...</div>
                        ) : slots.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                            {slots.map((slot) => {
                              const isSelectable = slot.available || (typeof slot.existing_appointments !== 'undefined' && slot.existing_appointments > 0);
                              return (
                                <button
                                  key={slot.time}
                                  onClick={() => handleInputChange('appointment_time', slot.time)}
                                  disabled={!isSelectable}
                                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors flex items-center justify-between gap-2 ${formData.appointment_time === slot.time
                                    ? 'bg-primary-600 text-white'
                                    : isSelectable
                                      ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                  <span>{slot.time}</span>
                                  {typeof slot.existing_appointments !== 'undefined' && slot.existing_appointments > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                      {slot.existing_appointments} bookings
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No available slots for this date</div>
                        )}
                      </div>
                    )}

                    {/* Existing Appointments for Selected Date */}
                    {dateAppointments.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          Existing Appointments ({dateAppointments.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {dateAppointments.map((apt) => (
                            <div
                              key={apt.name || apt.appointment_id}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs"
                            >
                              <div className="flex-shrink-0 w-16 font-medium text-gray-900">
                                {apt.appointment_time || '-'}
                              </div>
                              <div className="flex-1 text-gray-600 truncate">
                                {apt.patient_name}
                              </div>
                              <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${apt.status === 'Confirmed' ? 'bg-success-100 text-success-700' :
                                apt.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                  apt.status === 'Completed' ? 'bg-gray-200 text-gray-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {apt.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* WhatsApp Confirmation */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="whatsapp"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="whatsapp" className="text-sm text-gray-700 cursor-pointer">
                  Send WhatsApp Confirmation
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {selectedPatient && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isCreating ? 'Booking...' : 'Book Appointment'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewAppointmentPage;
