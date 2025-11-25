import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import { Sidebar } from '../components';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { usePatients } from '../hooks/usePatients';
import { useCreateInvoice } from '../hooks/usePayments';
import { PatientResponse, InvoiceItem as APIInvoiceItem } from '../api/types';
import toast from 'react-hot-toast';

// Local type for invoice items that allows empty strings for editing
type LocalInvoiceItem = Omit<APIInvoiceItem, 'qty' | 'rate'> & {
  id: string;
  qty: number | '';
  rate: number | '';
};

const InvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<LocalInvoiceItem[]>([
    { id: '1', item_code: '', description: '', qty: '' as const, rate: '' as const }
  ]);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [applyGST, setApplyGST] = useState(false);

  // API hooks
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { mutate: createInvoice, isPending: isCreating } = useCreateInvoice();

  // Set patient from navigation state if provided
  useEffect(() => {
    const statePatient = location.state?.patient;
    if (statePatient && !selectedPatient) {
      setSelectedPatient(statePatient);
    }
  }, [location.state, selectedPatient]);

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

  const addInvoiceItem = () => {
    setInvoiceItems(prev => [
      ...prev,
      { id: Date.now().toString(), item_code: '', description: '', qty: '' as const, rate: '' as const }
    ]);
  };

  const removeInvoiceItem = (id: string) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateInvoiceItem = (id: string, field: keyof LocalInvoiceItem, value: any) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === 'qty' || field === 'rate') {
        const input = String(value);
        if (input === '') return { ...item, [field]: '' as const };
        const num = field === 'qty' ? parseInt(input, 10) : parseFloat(input);
        return { ...item, [field]: isNaN(num) ? ('' as const) : num };
      }
      return { ...item, [field]: value };
    }));
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => {
      const qty = typeof item.qty === 'number' ? item.qty : parseFloat(String(item.qty)) || 0;
      const rate = typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate)) || 0;
      return sum + qty * rate;
    }, 0);
  };

  const calculateTax = () => {
    return applyGST ? calculateSubtotal() * 0.18 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (invoiceItems.some(item => !item.item_code || !item.description || Number(item.rate) <= 0)) {
      toast.error('Please fill in all required fields (Item Code, Description, and Rate)');
      return;
    }

    if (!invoiceData.dueDate) {
      toast.error('Please set a due date');
      return;
    }

    const invoiceRequest = {
      patient_id: selectedPatient.name, // Use 'name' which is the actual patient ID
      items: invoiceItems.map(({ id, qty, rate, ...rest }) => ({
        ...rest,
        qty: Number(qty) || 0,
        rate: Number(rate) || 0,
      })), // Remove local id field and coerce numerics
      posting_date: invoiceData.date,
      due_date: invoiceData.dueDate,
      remarks: invoiceData.notes || undefined
    };

    createInvoice(invoiceRequest, {
      onSuccess: () => {
        navigate(-1);
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-primary-50">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-20">
        <MobileContainer>
      <div className="min-h-screen bg-primary-50 relative">
        <TopBar 
          title="New Invoice"
          onBack={() => navigate(-1)}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 lg:pb-4" style={{ height: 'calc(100vh - 60px)' }}>
          
          {/* Desktop Layout - Centered with max width */}
          <div className="px-4 lg:px-6 py-4 lg:py-6">
            <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Invoice Header */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Invoice Details
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <InputField
                label="Invoice Number"
                type="text"
                value={invoiceData.invoiceNumber}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                disabled
              />
              <InputField
                label="Date"
                type="date"
                value={invoiceData.date}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <InputField
              label="Due Date *"
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </Card>

          {/* Patient Selection */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Bill To
            </h3>
            
            {selectedPatient ? (
              <div 
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer"
                onClick={() => setShowPatientList(true)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {(selectedPatient.patient_name || selectedPatient.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 font-lato">
                      {selectedPatient.patient_name || selectedPatient.name || 'Unknown Patient'}
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      {selectedPatient.mobile || 'No phone'}
                    </p>
                    <p className="text-xs text-gray-500 font-montserrat">
                      ID: {selectedPatient.patient_id || selectedPatient.name || 'N/A'}
                    </p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowPatientList(true)}
                className="w-full"
              >
                Select Patient
              </Button>
            )}
          </Card>

          {/* Invoice Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Invoice Items
              </h3>
              <Button
                size="sm"
                onClick={addInvoiceItem}
                className="flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Item</span>
              </Button>
            </div>

            <div className="space-y-4">
              {invoiceItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700">Item {index + 1}</span>
                    {invoiceItems.length > 1 && (
                      <button
                        onClick={() => removeInvoiceItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Item Code *</label>
                        <input
                          type="text"
                          placeholder="Enter item code"
                          value={item.item_code}
                          onChange={(e) => updateInvoiceItem(item.id, 'item_code', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
                        <input
                          type="text"
                          placeholder="Enter description"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={item.qty === '' ? '' : item.qty}
                          onChange={(e) => updateInvoiceItem(item.id, 'qty', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Rate (₹) *</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={item.rate === '' ? '' : item.rate}
                          onChange={(e) => updateInvoiceItem(item.id, 'rate', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="w-full p-2 bg-primary-50 border border-primary-200 rounded text-right">
                          <span className="text-xs text-gray-600 block">Amount</span>
                          <span className="text-sm font-bold text-primary-600">
                            ₹{(((typeof item.qty === 'number' ? item.qty : parseFloat(String(item.qty)) || 0) * (typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate)) || 0))).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Invoice Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="gst-toggle"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                    checked={applyGST} 
                    onChange={(e) => setApplyGST(e.target.checked)} 
                  />
                  <label htmlFor="gst-toggle" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Apply GST (18%)
                  </label>
                </div>
                <span className="text-xs text-gray-500">Optional</span>
              </div>
              
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                {applyGST && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (18%):</span>
                    <span className="font-semibold text-green-600">₹{calculateTax().toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-gray-800">Total Amount:</span>
                  <span className="font-bold text-primary-600 text-xl">₹{(calculateSubtotal() + calculateTax()).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes, payment terms, or special instructions..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="w-full"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </Card>
            </div>
          </div>
        </div>

        {/* Patient Selection Modal */}
        {showPatientList && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-96 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 font-lato">
                  Select Patient
                </h3>
                <button
                  onClick={() => setShowPatientList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto max-h-64 space-y-2">
                {patientsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !patients || patients.data.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No patients available
                  </div>
                ) : (
                  patients.data.map((patient) => (
                    <div
                      key={patient.patient_id || patient.name}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowPatientList(false);
                      }}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(patient.patient_name || patient.name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800 font-lato">
                          {patient.patient_name || patient.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-600 font-montserrat">
                          ID: {patient.patient_id || patient.name || 'N/A'} • {patient.mobile || 'No phone'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
      </div>
    </div>
  );
};

export default InvoicePage;
