import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { mockPatients } from '../data/mockData';
import { Patient } from '../types';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

const InvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, price: 0 }
  ]);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: ''
  });

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
      { id: Date.now().toString(), description: '', quantity: 1, price: 0 }
    ]);
  };

  const removeInvoiceItem = (id: string) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateInvoiceItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = () => {
    if (!selectedPatient || invoiceItems.some(item => !item.description || item.price <= 0)) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('Creating invoice:', {
      ...invoiceData,
      patient: selectedPatient,
      items: invoiceItems,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal()
    });

    alert('Invoice created successfully!');
    navigate('/home');
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gray-50 relative">
        <TopBar 
          title="New Invoice"
          onBack={() => navigate('/home')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="px-6 space-y-6">
          {/* Invoice Header */}
          <Card>
            <h3 className="text-sm font-bold text-gray-700 font-lato mb-4">
              Invoice Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
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
              label="Due Date"
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </Card>

          {/* Patient Selection */}
          <Card>
            <h3 className="text-sm font-bold text-gray-700 font-lato mb-4">
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
                      {selectedPatient.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 font-lato">
                      {selectedPatient.name}
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      {selectedPatient.phone}
                    </p>
                    <p className="text-xs text-gray-500 font-montserrat">
                      {selectedPatient.address}
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
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 font-lato">
                Items
              </h3>
              <Button size="sm" onClick={addInvoiceItem}>
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {invoiceItems.map((item, index) => (
                <div key={item.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-600 font-lato">
                      Item {index + 1}
                    </span>
                    {invoiceItems.length > 1 && (
                      <button
                        onClick={() => removeInvoiceItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Quantity"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateInvoiceItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-700">
                        Total: ₹{(item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <h3 className="text-sm font-bold text-gray-700 font-lato mb-4">
              Summary
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-montserrat">Subtotal:</span>
                <span className="font-bold">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-montserrat">Tax (18% GST):</span>
                <span className="font-bold">₹{calculateTax().toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-800 font-lato">Total:</span>
                <span className="font-bold text-primary-600 text-lg">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or payment terms..."
                className="w-full p-3 border border-gray-300 rounded-lg font-montserrat text-sm"
                rows={3}
              />
            </div>

            <div className="flex space-x-4 mt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/home')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
              >
                Create Invoice
              </Button>
            </div>
          </Card>
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
                {mockPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowPatientList(false);
                    }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 font-lato">
                        {patient.name}
                      </p>
                      <p className="text-xs text-gray-600 font-montserrat">
                        ID: {patient.id} • {patient.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default InvoicePage;
