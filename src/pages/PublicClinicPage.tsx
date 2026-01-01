import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicService } from '../api/services';
import {
    CalendarIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    StarIcon,
    UserGroupIcon,
    ClockIcon,
    SparklesIcon
} from '@heroicons/react/24/solid';
import {
    ArrowLongRightIcon,
    ShieldCheckIcon,
    HeartIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PublicClinicPage = () => {
    const { clinicId } = useParams<{ clinicId: string }>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [bookingStep, setBookingStep] = useState(1);

    // Booking State
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>('Check-up');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [patientDetails, setPatientDetails] = useState({
        name: '',
        mobile: '',
        sex: 'Unknown'
    });
    const [bookingLoading, setBookingLoading] = useState(false);

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true);
            const landingData = await publicService.getLandingData(clinicId!);
            console.log('🎨 Component Receive Data:', landingData);
            setData(landingData);
        } catch (error) {
            console.error('❌ Data load error:', error);
            toast.error('Failed to load clinic data');
        } finally {
            setLoading(false);
        }
    }, [clinicId]);

    const loadSlots = React.useCallback(async () => {
        try {
            const slotsData = await publicService.getPublicSlots(selectedDate, clinicId!, selectedDoctor || undefined) as any;
            console.log('📅 Received slots in component:', slotsData);
            if (slotsData?.slots) {
                setAvailableSlots(slotsData.slots.filter((s: any) => s.available));
            } else if (Array.isArray(slotsData)) {
                setAvailableSlots(slotsData.map((time: string) => ({ time, available: true })));
            } else {
                console.log('⚠️ Unexpected slots format:', slotsData);
            }
        } catch (error) {
            console.error('❌ Slots error:', error);
        }
    }, [selectedDate, clinicId, selectedDoctor]);

    useEffect(() => {
        if (clinicId) {
            loadData();
        }
    }, [clinicId, loadData]);

    useEffect(() => {
        if (selectedDate && clinicId) {
            loadSlots();
        }
    }, [selectedDate, clinicId, loadSlots]);

    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setBookingLoading(true);
            await publicService.bookPublicAppointment({
                clinic: clinicId!,
                patient_name: patientDetails.name,
                mobile: patientDetails.mobile,
                appointment_date: selectedDate,
                appointment_time: selectedSlot,
                practitioner: selectedDoctor || undefined,
                appointment_type: selectedAppointmentType,
                sex: patientDetails.sex,
                notes: 'Booked via Public Page'
            });
            setBookingStep(3);
        } catch (error: any) {
            toast.error(error.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data || !data.profile) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Clinic not found</div>;
    }

    const { profile, doctors, treatments, testimonials, gallery, stats } = data;
    const branding = profile.branding || {};
    const primaryColor = branding.primary_color || '#007AFF'; // Apple Blue

    // Dates for booking
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            date: d.toISOString().split('T')[0],
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate()
        };
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* HERO SECTION */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-[100px] animate-pulse delay-700"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="text-center lg:text-left space-y-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-semibold text-sm border border-blue-100">
                            <SparklesIcon className="h-4 w-4" />
                            <span>Redefining Dental Excellence</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">
                            {profile.basic_info.clinic_name}
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-2">
                                For Your Smile.
                            </span>
                        </h1>

                        <p className="text-xl text-gray-500 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                            Experience world-class dental care with cutting-edge technology and a team that treats you like family.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <button
                                onClick={() => document.querySelector('#booking-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
                            >
                                Book Appointment <ArrowLongRightIcon className="h-6 w-6" />
                            </button>
                            <button className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:border-gray-200 hover:bg-gray-50 transition-all duration-300">
                                View Services
                            </button>
                        </div>

                        <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 opacity-80">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})` }}></div>
                                ))}
                            </div>
                            <div className="text-left">
                                <div className="flex text-yellow-500 gap-1">
                                    {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} className="h-4 w-4" />)}
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{stats?.reviews || "4.9/5"} Ratings</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative hidden lg:block animate-fade-in-up delay-200">
                        <div className="relative z-10 grid grid-cols-2 gap-4">
                            <div className="space-y-4 mt-12">
                                <img src={gallery?.[0]?.url || "https://images.unsplash.com/photo-1629909613654-28e377c37b09"} className="rounded-[2.5rem] shadow-2xl object-cover h-64 w-full" alt="Clinic 1" />
                                <img src={gallery?.[1]?.url || "https://images.unsplash.com/photo-1579684385180-8c26c6dabb56"} className="rounded-[2.5rem] shadow-2xl object-cover h-48 w-full" alt="Clinic 2" />
                            </div>
                            <div className="space-y-4">
                                <img src={gallery?.[2]?.url || "https://images.unsplash.com/photo-1606811841689-23dfddce3e95"} className="rounded-[2.5rem] shadow-2xl object-cover h-48 w-full" alt="Clinic 3" />
                                <img src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5" className="rounded-[2.5rem] shadow-2xl object-cover h-64 w-full" alt="Clinic 4" />
                            </div>
                        </div>
                        {/* Floating Badge */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-white/50 text-center animate-bounce-slow">
                            <p className="text-3xl font-black text-blue-600">{stats?.patients || "5k+"}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Happy Patients</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS STRIP */}
            <div className="bg-gray-900 text-white py-12 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <ClockIcon className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats?.years_experience || "10+"}</p>
                            <p className="text-white/60 text-sm">Years Experience</p>
                        </div>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden md:block"></div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <UserGroupIcon className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats?.patients || "5000+"}</p>
                            <p className="text-white/60 text-sm">Patients Trusted</p>
                        </div>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden md:block"></div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <ShieldCheckIcon className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats?.surgeries || "1200+"}</p>
                            <p className="text-white/60 text-sm">Successful Surgeries</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SERVICES BENTO GRID */}
            <section className="py-24 bg-gray-50" id="services">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-black text-gray-900 mb-4">World Class Treatments</h2>
                        <p className="text-xl text-gray-500">Comprehensive care using the latest non-invasive techniques.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {treatments?.map((treatment: any, idx: number) => (
                            <div key={idx} className="group bg-white rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative z-10">
                                    <div className="h-14 w-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-bold shadow-lg shadow-blue-600/20">
                                        {treatment.title.charAt(0)}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{treatment.title}</h3>
                                    <p className="text-gray-500 mb-6 leading-relaxed">
                                        {treatment.description?.length > 80 ? treatment.description.substring(0, 80) + '...' : treatment.description}
                                    </p>
                                    <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform cursor-pointer">
                                        Learn more <ChevronRightIcon className="h-4 w-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* MEET THE TEAM */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-4xl font-black text-gray-900 mb-16 text-center">Meet Our Experts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {doctors?.map((doc: any, idx: number) => (
                            <div key={idx} className="group relative">
                                <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gray-100 mb-4">
                                    <img
                                        src={doc.image || `https://i.pravatar.cc/400?img=${idx + 50}`}
                                        alt={doc.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{doc.name}</h3>
                                <p className="text-blue-600 font-medium">{doc.specialization}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BOOKING SECTION */}
            <section id="booking-section" className="py-24 bg-gray-900 text-white relative">
                <div className="max-w-5xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black mb-4">Ready for your visit?</h2>
                        <p className="text-white/60 text-lg">Book instantly online. No login required.</p>
                    </div>

                    <div className="bg-white text-gray-900 rounded-[2.5rem] shadow-2xl p-8 lg:p-12">
                        {/* Reusing existing booking logic but with improved styling */}
                        {bookingStep === 1 && (
                            <div className="space-y-8 animate-fade-in-up">
                                {/* Doctor Selection */}
                                {doctors && doctors.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Select Doctor</label>
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                            {doctors.map((doc: any) => (
                                                <button
                                                    key={doc.id}
                                                    onClick={() => setSelectedDoctor(doc.id)}
                                                    className={`flex-shrink-0 min-w-[160px] p-4 rounded-2xl flex flex-col items-center text-center border-2 transition-all ${selectedDoctor === doc.id
                                                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                                        }`}
                                                >
                                                    <div className="h-16 w-16 rounded-full bg-gray-200 mb-3 overflow-hidden">
                                                        {doc.image ? (
                                                            <img src={doc.image} alt={doc.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-gray-500 text-xl font-bold">
                                                                {doc.name?.charAt(0) || 'D'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="font-bold text-gray-900 text-sm">{doc.name}</p>
                                                    <p className="text-xs text-gray-500">{doc.specialization}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Appointment Type */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Appointment Type</label>
                                    <div className="flex flex-wrap gap-3">
                                        {['Check-up', 'Consultation', 'Follow-up', 'Cleaning', 'Treatment'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedAppointmentType(type)}
                                                className={`px-5 py-3 rounded-xl font-semibold transition-all ${selectedAppointmentType === type
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Select Date</label>
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                        {dates.map((d) => (
                                            <button
                                                key={d.date}
                                                onClick={() => { setSelectedDate(d.date); setSelectedSlot(''); }}
                                                className={`flex-shrink-0 w-20 h-24 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${selectedDate === d.date
                                                    ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                                                    }`}
                                            >
                                                <span className={`text-xs font-bold uppercase ${selectedDate === d.date ? 'text-blue-200' : 'text-gray-400'}`}>{d.day}</span>
                                                <span className="text-2xl font-black">{d.dayNum}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedDate && (
                                    <div className="animate-fade-in-up">
                                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Available Slots</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                            {availableSlots.length > 0 ? availableSlots.map((slot: any) => (
                                                <button
                                                    key={slot.time}
                                                    onClick={() => setSelectedSlot(slot.time)}
                                                    className={`py-3 px-2 rounded-xl text-sm font-bold transition-all ${selectedSlot === slot.time
                                                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50'
                                                        }`}
                                                >
                                                    {slot.time.slice(0, 5)}
                                                </button>
                                            )) : (
                                                <p className="col-span-full text-center py-8 text-gray-400">No slots available.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-8">
                                    <button
                                        disabled={!selectedDate || !selectedSlot}
                                        onClick={() => setBookingStep(2)}
                                        className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg disabled:opacity-30 hover:scale-105 transition-transform"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {bookingStep === 2 && (
                            <form onSubmit={handleBookAppointment} className="max-w-md mx-auto space-y-6 animate-fade-in-up">
                                <div className="text-center pb-6">
                                    <p className="text-gray-400 uppercase tracking-widest text-xs font-bold">Booking Summary</p>
                                    <p className="text-2xl font-black text-gray-900 mt-2">
                                        {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-xl text-blue-600 font-bold">at {selectedSlot.slice(0, 5)}</p>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        required
                                        className="w-full bg-gray-50 border-0 rounded-xl px-6 py-4 font-medium focus:ring-2 focus:ring-blue-600 transition outline-none"
                                        placeholder="Full Name"
                                        value={patientDetails.name}
                                        onChange={e => setPatientDetails({ ...patientDetails, name: e.target.value })}
                                    />
                                    <input
                                        required
                                        type="tel"
                                        className="w-full bg-gray-50 border-0 rounded-xl px-6 py-4 font-medium focus:ring-2 focus:ring-blue-600 transition outline-none"
                                        placeholder="Phone Number"
                                        value={patientDetails.mobile}
                                        onChange={e => setPatientDetails({ ...patientDetails, mobile: e.target.value })}
                                    />
                                    <select
                                        className="w-full bg-gray-50 border-0 rounded-xl px-6 py-4 font-medium focus:ring-2 focus:ring-blue-600 transition outline-none appearance-none"
                                        value={patientDetails.sex}
                                        onChange={e => setPatientDetails({ ...patientDetails, sex: e.target.value })}
                                    >
                                        <option value="Unknown">Select Gender (Optional)</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setBookingStep(1)}
                                        className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 rounded-xl"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={bookingLoading}
                                        className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all flex justify-center items-center gap-2"
                                    >
                                        {bookingLoading ? (
                                            <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>Confirm Booking <CheckCircleIcon className="h-6 w-6" /></>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {bookingStep === 3 && (
                            <div className="text-center py-12 animate-fade-in-up">
                                <div className="h-32 w-32 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
                                    <CheckCircleIcon className="h-16 w-16" />
                                </div>
                                <h2 className="text-4xl font-black text-gray-900 mb-4">Confirmed!</h2>
                                <p className="text-xl text-gray-500 max-w-md mx-auto mb-12">
                                    We've sent the details to {patientDetails.mobile}. see you soon!
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-blue-600 font-bold hover:text-blue-800 underline active:scale-95 transition-transform"
                                >
                                    Book Another Appointment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-white border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="text-3xl font-black mb-6">{profile.basic_info.clinic_name}</h2>
                        <p className="text-gray-400 max-w-sm text-lg leading-relaxed">
                            Providing world-class dentistry designed around you. Your comfort and health are our absolute priority.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-6 text-gray-200">Contact</h3>
                        <ul className="space-y-4 text-gray-400">
                            <li className="flex items-start gap-3">
                                <MapPinIcon className="h-6 w-6 text-blue-500 shrink-0" />
                                {profile.address?.city}, {profile.address?.state}
                            </li>
                            <li className="flex items-center gap-3">
                                <PhoneIcon className="h-5 w-5 text-blue-500 shrink-0" />
                                {profile.address?.phone || "+91 000 000 0000"}
                            </li>
                            <li className="flex items-center gap-3">
                                <EnvelopeIcon className="h-5 w-5 text-blue-500 shrink-0" />
                                {profile.address?.email || "contact@clinic.com"}
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-6 text-gray-200">Legal</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li>Privacy Policy</li>
                            <li>Terms of Service</li>
                            <li>Cookie Policy</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
                    &copy; {new Date().getFullYear()} {profile.basic_info.clinic_name}. Powered by DentCharts.
                </div>
            </footer>
        </div>
    );
};

export default PublicClinicPage;
