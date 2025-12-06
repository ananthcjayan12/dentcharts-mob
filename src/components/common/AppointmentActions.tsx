import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteInvoice } from '../../hooks/usePayments';
import { AppointmentResponse } from '../../api/types';
import Button from './Button';
import toast from 'react-hot-toast';

interface AppointmentActionsProps {
  appointment: AppointmentResponse;
  onCheckIn?: (appointmentId: string) => void;
  onStartVisit?: (appointmentId: string) => void;
  onCompleteVisit?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onUploadFiles?: (appointmentId: string) => void;
  onToggleReview?: (appointmentId: string, requested: boolean) => void;
}

const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  appointment,
  onCheckIn,
  onStartVisit,
  onCompleteVisit,
  onCancel,
  onUploadFiles,
  onToggleReview,
}) => {
  const navigate = useNavigate();
  const appointmentId = appointment.name || appointment.appointment_id || '';
  const status = appointment.status;
  const deleteInvoiceMutation = useDeleteInvoice();

  const handleCreateInvoice = () => {
    // Navigate to invoice page with appointment and patient data
    navigate('/invoice', {
      state: {
        patient: {
          patient_id: appointment.patient || appointment.patient_id,
          name: appointment.patient || appointment.patient_id,
          patient_name: appointment.patient_name,
          mobile: appointment.patient_mobile,
        },
        appointment: {
          appointment_id: appointmentId,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
        },
      },
    });
  };

  const handleMakePayment = () => {
    if (appointment.invoice_id) {
      // Navigate to invoice page in edit mode
      navigate(`/invoice/${appointment.invoice_id}`);
    } else {
      handleCreateInvoice();
    }
  };

  // Booked/Scheduled/Confirmed Status - Show Check In and Cancel
  if (status === 'Scheduled' || status === 'Confirmed' || status === 'Open') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onCheckIn?.(appointmentId)}
          className="text-xs sm:text-sm px-3 py-1.5"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Check In
        </Button>
        <Button
          variant="outline"
          onClick={() => onCancel?.(appointmentId)}
          className="text-xs sm:text-sm px-3 py-1.5"
        >
          Cancel
        </Button>
      </div>
    );
  }

  // Waiting Status - Show Start Visit and Cancel
  if (status === 'Waiting') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onStartVisit?.(appointmentId)}
          className="text-xs sm:text-sm px-3 py-1.5"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Visit
        </Button>
        <Button
          variant="outline"
          onClick={() => onCancel?.(appointmentId)}
          className="text-xs sm:text-sm px-3 py-1.5"
        >
          Cancel
        </Button>
      </div>
    );
  }

  // In Progress Status - Show Complete Visit
  if (status === 'In Progress') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onCompleteVisit?.(appointmentId)}
          className="text-xs sm:text-sm px-3 py-1.5"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Complete Visit
        </Button>
      </div>
    );
  }

  // Pending Payment Status - Show Create Invoice or Make Payment
  if (status === 'Pending Payment') {
    return (
      <div className="flex flex-wrap gap-2">
        {appointment.invoiced ? (
          <>
            <Button
              onClick={handleMakePayment}
              className="text-xs sm:text-sm px-3 py-1.5"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Make Payment
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const invId = appointment.invoice_id;
                if (!invId) {
                  toast.error('No invoice to delete');
                  return;
                }
                if (!window.confirm('Delete this invoice? This action cannot be undone.')) return;
                try {
                  await deleteInvoiceMutation.mutateAsync(invId);
                } catch (err) {
                  // handled by hook
                }
              }}
              className="text-xs sm:text-sm px-3 py-1.5"
            >
              Delete Invoice
            </Button>
          </>
        ) : (
          <Button
            onClick={handleCreateInvoice}
            className="text-xs sm:text-sm px-3 py-1.5"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Create Invoice
          </Button>
        )}
      </div>
    );
  }

  // Completed Status - Show Upload Files and Google Review
  if (status === 'Completed') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onUploadFiles?.(appointmentId)}
          className="text-xs sm:text-sm px-3 py-1.5"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Files
        </Button>
        <Button
          variant={appointment.review_requested ? 'outline' : 'primary'}
          onClick={() => onToggleReview?.(appointmentId, !appointment.review_requested)}
          className="text-xs sm:text-sm px-3 py-1.5"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {appointment.review_requested ? '✓ Review Requested' : 'Request Review'}
        </Button>
      </div>
    );
  }

  // Cancelled Status - No actions
  if (status === 'Cancelled') {
    return (
      <div className="text-xs text-gray-500">
        No actions available
      </div>
    );
  }

  // Default fallback
  return null;
};

export default AppointmentActions;
