
import React from 'react';
import { PatientSummaryPrintData, generatePatientSummaryHTML } from '../../utils/patientSummaryTemplates';
import { printHTML, generatePdfBlobFromHtml } from '../../utils/printUtils';
import Button from '../common/Button';
import Portal from '../common/Portal';
import toast from 'react-hot-toast';

interface PatientSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PatientSummaryPrintData;
}

const PatientSummaryModal: React.FC<PatientSummaryModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const html = generatePatientSummaryHTML(data);
    printHTML(html);
  };

  const handleExportPDF = async () => {
    const html = generatePatientSummaryHTML(data);
    try {
      toast.loading('Generating PDF...', { id: 'pdf-gen' });
      const blob = await generatePdfBlobFromHtml(html, `Summary_${data.patientName}_${data.generatedDate}.pdf`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Summary_${data.patientName}_${data.generatedDate.replace(/\//g, '-')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF Generated Successfully', { id: 'pdf-gen' });
    } catch (error) {
      console.error('PDF Generation failed', error);
      toast.error('Failed to generate PDF', { id: 'pdf-gen' });
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[1300] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full h-full sm:max-w-5xl sm:h-[95vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header / Actions */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-gray-900">Patient Summary Preview</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF}
                leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
              >
                Export PDF
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handlePrint}
                leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>}
              >
                Print Report
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-8">
            <div className="bg-white shadow-sm mx-auto overflow-hidden" style={{ minHeight: '100%' }}>
              <div 
                dangerouslySetInnerHTML={{ __html: generatePatientSummaryHTML(data) }} 
                className="patient-summary-preview"
              />
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default PatientSummaryModal;
