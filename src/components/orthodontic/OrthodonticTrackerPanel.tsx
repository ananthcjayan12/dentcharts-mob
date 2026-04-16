import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { clinicProfileService, ClinicConsultant } from '../../api/services/clinicProfile';
import {
  CreateOrthodonticCaseRequest,
  OrthodonticCaseSummary,
  OrthodonticLedgerEntry,
  OrthodonticPayout,
  orthodonticService,
} from '../../api/services/orthodontic';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePractitioners } from '../../hooks/usePractitioners';
import {
  useAddOrthodonticLedgerEntry,
  useCreateOrthodonticCase,
  useCreateOrthodonticPayout,
  useOrthodonticLedger,
  useOrthodonticPayouts,
  usePatientOrthodonticSummary,
  useReverseOrthodonticPayout,
  useUpdateOrthodonticCase,
} from '../../hooks/useOrthodontic';
import { printHTML } from '../../utils/printUtils';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Card from '../common/Card';
import InputField from '../common/InputField';
import Portal from '../common/Portal';

type CaseFormState = {
  practitioner_id: string;
  consultant_id: string;
  case_type: string;
  start_date: string;
  estimated_duration_months: string;
  package_fee: string;
  discount_amount: string;
  advance_paid: string;
  advance_payment_mode: string;
  default_followup_days: string;
  notes: string;
  commission_model: string;
  commission_type: string;
  commission_value: string;
  commission_basis: string;
};

type VisitFormState = {
  visit_date: string;
  visit_notes: string;
  payment_amount: string;
  payment_mode: string;
  next_appointment_date: string;
  commission_override: boolean;
  commission_type: string;
  commission_value: string;
  commission_basis: string;
  commission_note: string;
};

type PayoutFormState = {
  paid_amount: string;
  posting_date: string;
  payment_mode: string;
  reference_no: string;
  notes: string;
};

interface OrthodonticTrackerPanelProps {
  patientId: string;
  patientName?: string;
}

const todayValue = () => new Date().toISOString().split('T')[0];

const emptyCaseForm = (currentPractitionerId?: string): CaseFormState => ({
  practitioner_id: currentPractitionerId || '',
  consultant_id: '',
  case_type: '',
  start_date: todayValue(),
  estimated_duration_months: '',
  package_fee: '',
  discount_amount: '0',
  advance_paid: '0',
  advance_payment_mode: 'Cash',
  default_followup_days: '30',
  notes: '',
  commission_model: 'None',
  commission_type: 'Percentage',
  commission_value: '0',
  commission_basis: 'On collected amount',
});

const emptyVisitForm = (): VisitFormState => ({
  visit_date: todayValue(),
  visit_notes: '',
  payment_amount: '0',
  payment_mode: 'Cash',
  next_appointment_date: '',
  commission_override: false,
  commission_type: 'Percentage',
  commission_value: '',
  commission_basis: 'On collected amount',
  commission_note: '',
});

const emptyPayoutForm = (): PayoutFormState => ({
  paid_amount: '',
  posting_date: todayValue(),
  payment_mode: 'Bank Transfer',
  reference_no: '',
  notes: '',
});

const formatCurrency = (amount?: number | null) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : 'Not set';

const statusVariant = (status?: string) => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Planned':
      return 'primary';
    case 'On Hold':
      return 'warning';
    case 'Cancelled':
      return 'danger';
    default:
      return 'gray';
  }
};

const payoutVariant = (status?: string) => {
  switch (status) {
    case 'Paid':
      return 'success';
    case 'Partly Paid':
      return 'warning';
    case 'Unpaid':
      return 'danger';
    default:
      return 'gray';
  }
};

const buildOrthodonticPrintHtml = (payload: {
  case: OrthodonticCaseSummary;
  patient: any;
  ledger: OrthodonticLedgerEntry[];
}) => {
  const rows = payload.ledger
    .map(
      (entry) => `
        <tr>
          <td>${formatDate(entry.visit_date)}</td>
          <td>${formatDate(entry.next_appointment_date)}</td>
          <td>${formatCurrency(entry.payment_amount)}</td>
          <td>${formatCurrency(entry.balance_after_entry)}</td>
          <td>${entry.visit_notes || '-'}</td>
        </tr>
      `
    )
    .join('');

  return `
    <html>
      <head>
        <title>Orthodontic Card</title>
        <style>
          body { font-family: Poppins, Arial, sans-serif; padding: 24px; color: #1f2937; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
          .meta-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #f9fafb; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; }
          th { background: #eff6ff; color: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="margin:0 0 8px;">Orthodontic Card</h2>
            <div>Patient: ${payload.patient?.patient_name || payload.case.patient_name}</div>
            <div>Patient ID: ${payload.patient?.patient_id || payload.case.patient_id}</div>
          </div>
          <div>
            <div>Doctor: ${payload.case.practitioner_name || '-'}</div>
            <div>Status: ${payload.case.status}</div>
            <div>Start: ${formatDate(payload.case.start_date)}</div>
          </div>
        </div>
        <div class="meta">
          <div class="meta-card"><strong>Package</strong><div>${formatCurrency(payload.case.net_fee)}</div></div>
          <div class="meta-card"><strong>Paid</strong><div>${formatCurrency(payload.case.total_paid)}</div></div>
          <div class="meta-card"><strong>Balance</strong><div>${formatCurrency(payload.case.balance_amount)}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Next Appointment</th>
              <th>Payment</th>
              <th>Balance</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="5">No visits recorded</td></tr>'}</tbody>
        </table>
      </body>
    </html>
  `;
};

const ModalShell: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <Portal>
    <div className="fixed inset-0 z-[1200] bg-black/50 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  </Portal>
);

const SummaryMetric: React.FC<{
  label: string;
  value: string;
  tone?: 'primary' | 'success' | 'warning' | 'gray';
}> = ({ label, value, tone = 'gray' }) => {
  const toneClass = {
    primary: 'bg-primary-50 border-primary-100 text-primary-700',
    success: 'bg-green-50 border-green-100 text-green-700',
    warning: 'bg-orange-50 border-orange-100 text-orange-700',
    gray: 'bg-gray-50 border-gray-100 text-gray-700',
  }[tone];

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 text-base font-bold">{value}</div>
    </div>
  );
};

const OrthodonticTrackerPanel: React.FC<OrthodonticTrackerPanelProps> = ({
  patientId,
  patientName,
}) => {
  const { clinicId } = useClinic();
  const { user, canAccessPage } = useAuth();
  const { data: practitionersData } = usePractitioners();
  const practitioners = practitionersData?.data || [];
  const canManagePayouts = Boolean(
    user?.permissions?.is_clinic_admin && canAccessPage('financial_dashboard')
  );
  const canCreateReceipts = canAccessPage('invoice');

  const { data: summary, isLoading: summaryLoading } = usePatientOrthodonticSummary(
    patientId,
    clinicId
  );
  const caseId = summary?.case_id || '';
  const { data: ledgerData, isLoading: ledgerLoading } = useOrthodonticLedger(caseId);
  const { data: payoutsData, isLoading: payoutsLoading } = useOrthodonticPayouts(
    canManagePayouts ? caseId : null
  );

  const createCaseMutation = useCreateOrthodonticCase(patientId, clinicId);
  const updateCaseMutation = useUpdateOrthodonticCase(patientId, clinicId);
  const addVisitMutation = useAddOrthodonticLedgerEntry(patientId, clinicId);
  const createPayoutMutation = useCreateOrthodonticPayout(patientId, clinicId);
  const reversePayoutMutation = useReverseOrthodonticPayout(patientId, caseId, clinicId);

  const [consultants, setConsultants] = useState<ClinicConsultant[]>([]);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [caseForm, setCaseForm] = useState<CaseFormState>(emptyCaseForm(user?.practitioner_id));
  const [visitForm, setVisitForm] = useState<VisitFormState>(emptyVisitForm());
  const [payoutForm, setPayoutForm] = useState<PayoutFormState>(emptyPayoutForm());

  useEffect(() => {
    if (!clinicId) {
      setConsultants([]);
      return;
    }

    let active = true;
    clinicProfileService
      .getClinicConsultants(clinicId)
      .then((response) => {
        if (active) {
          setConsultants((response.consultants || []).filter((row) => row.is_active));
        }
      })
      .catch(() => {
        if (active) {
          setConsultants([]);
        }
      });

    return () => {
      active = false;
    };
  }, [clinicId]);

  useEffect(() => {
    if (summary?.case_id) {
      setCaseForm({
        practitioner_id: summary.practitioner_id || user?.practitioner_id || '',
        consultant_id: summary.consultant_id || '',
        case_type: summary.case_type || '',
        start_date: summary.start_date || todayValue(),
        estimated_duration_months: summary.estimated_duration_months
          ? String(summary.estimated_duration_months)
          : '',
        package_fee: summary.package_fee ? String(summary.package_fee) : '',
        discount_amount: String(summary.discount_amount || 0),
        advance_paid: String(summary.advance_paid || 0),
        advance_payment_mode: 'Cash',
        default_followup_days: String(summary.default_followup_days || 30),
        notes: summary.notes || '',
        commission_model: summary.commission_model || 'None',
        commission_type: summary.commission_type || 'Percentage',
        commission_value: String(summary.commission_value || 0),
        commission_basis: summary.commission_basis || 'On collected amount',
      });
    } else {
      setCaseForm(emptyCaseForm(user?.practitioner_id));
    }
  }, [summary, user?.practitioner_id]);

  useEffect(() => {
    setVisitForm((current) => ({
      ...current,
      next_appointment_date: summary?.next_appointment_date || current.next_appointment_date,
      commission_basis: summary?.commission_basis || current.commission_basis,
      commission_type: summary?.commission_type || current.commission_type,
    }));
  }, [summary?.next_appointment_date, summary?.commission_basis, summary?.commission_type]);

  const ledgerEntries = ledgerData?.ledger || summary?.recent_ledger || [];
  const payoutEntries = payoutsData?.payouts || [];

  const totalProjectedBalance = useMemo(() => {
    const payment = Number(visitForm.payment_amount || 0);
    return Math.max((summary?.balance_amount || 0) - payment, 0);
  }, [summary?.balance_amount, visitForm.payment_amount]);
  const advanceAmount = Number(caseForm.advance_paid || 0);
  const visitPaymentAmount = Number(visitForm.payment_amount || 0);

  const handleCaseSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload: CreateOrthodonticCaseRequest = {
      patient_id: patientId,
      practitioner_id: caseForm.practitioner_id,
      consultant_id: caseForm.consultant_id || undefined,
      case_type: caseForm.case_type,
      start_date: caseForm.start_date,
      estimated_duration_months: caseForm.estimated_duration_months || undefined,
      package_fee: caseForm.package_fee,
      discount_amount: caseForm.discount_amount,
      advance_paid: caseForm.advance_paid,
      advance_payment_mode: advanceAmount > 0 ? caseForm.advance_payment_mode : undefined,
      default_followup_days: caseForm.default_followup_days,
      notes: caseForm.notes,
      commission_model: caseForm.commission_model,
      commission_type: caseForm.commission_type,
      commission_value: caseForm.commission_value,
      commission_basis: caseForm.commission_basis,
      clinic: clinicId || undefined,
    };

    if (!payload.practitioner_id || !payload.package_fee) {
      toast.error('Doctor and package fee are required');
      return;
    }
    if (!summary?.case_id && advanceAmount > 0 && !canCreateReceipts) {
      toast.error('Invoice access is required to collect the opening advance');
      return;
    }
    if (!summary?.case_id && advanceAmount > 0 && !caseForm.advance_payment_mode) {
      toast.error('Select a payment mode for the opening advance');
      return;
    }

    try {
      if (summary?.case_id) {
        await updateCaseMutation.mutateAsync({
          caseId: summary.case_id,
          payload,
        });
      } else {
        await createCaseMutation.mutateAsync(payload);
      }
      setShowCaseModal(false);
    } catch {
      // handled by mutation
    }
  };

  const handleVisitSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!caseId) {
      toast.error('Create an orthodontic case first');
      return;
    }
    if (visitPaymentAmount > 0 && !canCreateReceipts) {
      toast.error('Invoice access is required to collect orthodontic payments');
      return;
    }
    if (visitPaymentAmount > 0 && !visitForm.payment_mode) {
      toast.error('Select a payment mode for the collected amount');
      return;
    }

    try {
      await addVisitMutation.mutateAsync({
        case_id: caseId,
        visit_date: visitForm.visit_date,
        visit_notes: visitForm.visit_notes,
        payment_amount: visitForm.payment_amount,
        payment_mode: visitPaymentAmount > 0 ? visitForm.payment_mode : undefined,
        next_appointment_date: visitForm.next_appointment_date || undefined,
        commission_override: visitForm.commission_override,
        commission_type: visitForm.commission_override
          ? visitForm.commission_type
          : undefined,
        commission_value: visitForm.commission_override
          ? visitForm.commission_value
          : undefined,
        commission_basis: visitForm.commission_override
          ? visitForm.commission_basis
          : undefined,
        commission_note: visitForm.commission_note || undefined,
      });
      setShowVisitModal(false);
      setVisitForm(emptyVisitForm());
    } catch {
      // handled by mutation
    }
  };

  const handlePayoutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!caseId) {
      return;
    }

    try {
      await createPayoutMutation.mutateAsync({
        case_id: caseId,
        paid_amount: payoutForm.paid_amount,
        posting_date: payoutForm.posting_date,
        payment_mode: payoutForm.payment_mode,
        reference_no: payoutForm.reference_no,
        notes: payoutForm.notes,
      });
      setShowPayoutModal(false);
      setPayoutForm(emptyPayoutForm());
      setShowFinanceModal(true);
    } catch {
      // handled by mutation
    }
  };

  const handlePrintCard = async () => {
    if (!caseId) {
      return;
    }

    try {
      const data = await orthodonticService.getPrintData(caseId);
      printHTML(buildOrthodonticPrintHtml(data));
    } catch (error: any) {
      toast.error(error.message || 'Failed to prepare print card');
    }
  };

  const handleReversePayout = async (payout: OrthodonticPayout) => {
    const confirmed = window.confirm('Reverse this payout? The ledger audit trail will be preserved.');
    if (!confirmed) {
      return;
    }

    try {
      await reversePayoutMutation.mutateAsync({
        payoutId: payout.payout_id,
        notes: 'Reversed from orthodontic tracker',
      });
    } catch {
      // handled by mutation
    }
  };

  return (
    <Card className="p-4 lg:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base lg:text-lg font-bold text-gray-900">Orthodontic Tracker</h3>
              {summary?.status && (
                <Badge variant={statusVariant(summary.status)} size="sm">
                  {summary.status}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Keep the package value, installments, next visit, and orthodontist commission in one place.
            </p>
          </div>

          <div
            className={`w-full lg:w-auto ${
              summary?.case_id
                ? 'grid grid-cols-3 gap-2 lg:flex lg:flex-wrap lg:justify-end'
                : 'flex gap-2'
            }`}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCaseModal(true)}
              className={summary?.case_id ? 'w-full h-8 px-2 text-xs sm:text-sm whitespace-nowrap' : ''}
            >
              {summary?.case_id ? 'Edit Case' : 'Start Case'}
            </Button>
            {summary?.case_id && (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowVisitModal(true)}
                  className="w-full h-8 px-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  Add Visit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLedgerModal(true)}
                  className="w-full h-8 px-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  View Details
                </Button>
              </>
            )}
          </div>
        </div>

        {summaryLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : !summary?.case_id ? (
          <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/50 p-5">
            <div className="text-sm font-semibold text-primary-700">No active orthodontic case</div>
            <p className="mt-1 text-sm text-gray-600">
              Start a case for {patientName || 'this patient'} to track package fee, installment visits, and commission payouts.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">Balance Amount</div>
                <div className="mt-2 text-3xl font-bold text-orange-700">
                  {formatCurrency(summary.balance_amount)}
                </div>
                <div className="mt-2 text-xs text-orange-700/80">
                  Package {formatCurrency(summary.net_fee)} · Collected {formatCurrency(summary.total_paid)}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Next Visit</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{formatDate(summary.next_appointment_date)}</div>
                <div className="mt-2 text-sm text-gray-500">
                  {summary.case_type || 'Orthodontic Case'}
                  {summary.practitioner_name ? ` · ${summary.practitioner_name}` : ''}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {ledgerEntries.length} visits logged
              {summary.last_payment_date ? ` · Last payment ${formatDate(summary.last_payment_date)}` : ''}
              {summary.last_visit_date ? ` · Last visit ${formatDate(summary.last_visit_date)}` : ''}
              {' · '}Open details for the full ledger, receipts, print card, and commission records.
            </div>
          </>
        )}
      </div>

      {showCaseModal && (
        <ModalShell
          title={summary?.case_id ? 'Edit Orthodontic Case' : 'Start Orthodontic Case'}
          onClose={() => setShowCaseModal(false)}
        >
          <form className="space-y-5" onSubmit={handleCaseSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Treating Doctor</label>
                <select
                  value={caseForm.practitioner_id}
                  onChange={(event) =>
                    setCaseForm((current) => ({ ...current, practitioner_id: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Select doctor</option>
                  {practitioners.map((practitioner) => (
                    <option key={practitioner.name} value={practitioner.name}>
                      {practitioner.practitioner_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Orthodontist Consultant</label>
                <select
                  value={caseForm.consultant_id}
                  onChange={(event) =>
                    setCaseForm((current) => ({ ...current, consultant_id: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                >
                  <option value="">No consultant</option>
                  {consultants.map((consultant) => (
                    <option key={consultant.consultant_id} value={consultant.consultant_id}>
                      {consultant.consultant_name}
                    </option>
                  ))}
                </select>
              </div>
              <InputField
                label="Case Type"
                value={caseForm.case_type}
                onChange={(event) =>
                  setCaseForm((current) => ({ ...current, case_type: event.target.value }))
                }
                placeholder="Fixed braces, aligners..."
              />
              <InputField
                label="Start Date"
                type="date"
                value={caseForm.start_date}
                onChange={(event) =>
                  setCaseForm((current) => ({ ...current, start_date: event.target.value }))
                }
              />
              <InputField
                label="Estimated Duration (Months)"
                type="number"
                value={caseForm.estimated_duration_months}
                onChange={(event) =>
                  setCaseForm((current) => ({
                    ...current,
                    estimated_duration_months: event.target.value,
                  }))
                }
              />
              <InputField
                label="Default Follow-up Days"
                type="number"
                value={caseForm.default_followup_days}
                onChange={(event) =>
                  setCaseForm((current) => ({
                    ...current,
                    default_followup_days: event.target.value,
                  }))
                }
              />
              <InputField
                label="Package Fee"
                type="number"
                value={caseForm.package_fee}
                onChange={(event) =>
                  setCaseForm((current) => ({ ...current, package_fee: event.target.value }))
                }
              />
              <InputField
                label="Discount Amount"
                type="number"
                value={caseForm.discount_amount}
                onChange={(event) =>
                  setCaseForm((current) => ({ ...current, discount_amount: event.target.value }))
                }
              />
              <InputField
                label="Advance Paid"
                type="number"
                value={caseForm.advance_paid}
                disabled={Boolean(summary?.case_id)}
                onChange={(event) =>
                  setCaseForm((current) => ({ ...current, advance_paid: event.target.value }))
                }
                helperText={
                  summary?.case_id
                    ? 'Opening advance is fixed after case creation.'
                    : 'If an advance is collected now, a receipt will be created automatically.'
                }
              />
              {!summary?.case_id && advanceAmount > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Advance Payment Mode</label>
                  <select
                    value={caseForm.advance_payment_mode}
                    onChange={(event) =>
                      setCaseForm((current) => ({
                        ...current,
                        advance_payment_mode: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">The opening advance will be receipted automatically.</p>
                </div>
              )}
              {canManagePayouts && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Commission Model</label>
                    <select
                      value={caseForm.commission_model}
                      onChange={(event) =>
                        setCaseForm((current) => ({ ...current, commission_model: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Percentage">Percentage</option>
                      <option value="Fixed per payment">Fixed per payment</option>
                      <option value="Fixed per case">Fixed per case</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Commission Type</label>
                    <select
                      value={caseForm.commission_type}
                      onChange={(event) =>
                        setCaseForm((current) => ({ ...current, commission_type: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="Percentage">Percentage</option>
                      <option value="Fixed">Fixed</option>
                    </select>
                  </div>
                  <InputField
                    label="Commission Value"
                    type="number"
                    value={caseForm.commission_value}
                    onChange={(event) =>
                      setCaseForm((current) => ({
                        ...current,
                        commission_value: event.target.value,
                      }))
                    }
                  />
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Commission Basis</label>
                    <select
                      value={caseForm.commission_basis}
                      onChange={(event) =>
                        setCaseForm((current) => ({ ...current, commission_basis: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="On collected amount">On collected amount</option>
                      <option value="On net case value">On net case value</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Notes</label>
              <textarea
                value={caseForm.notes}
                onChange={(event) =>
                  setCaseForm((current) => ({ ...current, notes: event.target.value }))
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                placeholder="Case notes, treatment plan, reminders..."
              />
            </div>

            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">Live Summary</div>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryMetric
                  label="Net Fee"
                  value={formatCurrency(Number(caseForm.package_fee || 0) - Number(caseForm.discount_amount || 0))}
                  tone="primary"
                />
                <SummaryMetric label="Advance" value={formatCurrency(Number(caseForm.advance_paid || 0))} tone="success" />
                <SummaryMetric
                  label="Opening Balance"
                  value={formatCurrency(
                    Math.max(
                      Number(caseForm.package_fee || 0) -
                        Number(caseForm.discount_amount || 0) -
                        Number(caseForm.advance_paid || 0),
                      0
                    )
                  )}
                  tone="warning"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowCaseModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createCaseMutation.isPending || updateCaseMutation.isPending}
              >
                Save Case
              </Button>
            </div>
          </form>
        </ModalShell>
      )}

      {showVisitModal && summary?.case_id && (
        <ModalShell title="Add Orthodontic Visit" onClose={() => setShowVisitModal(false)}>
          <form className="space-y-5" onSubmit={handleVisitSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Visit Date"
                type="date"
                value={visitForm.visit_date}
                onChange={(event) =>
                  setVisitForm((current) => ({ ...current, visit_date: event.target.value }))
                }
              />
              <InputField
                label="Next Appointment"
                type="date"
                value={visitForm.next_appointment_date}
                onChange={(event) =>
                  setVisitForm((current) => ({
                    ...current,
                    next_appointment_date: event.target.value,
                  }))
                }
              />
              <InputField
                label="Payment Collected"
                type="number"
                value={visitForm.payment_amount}
                onChange={(event) =>
                  setVisitForm((current) => ({
                    ...current,
                    payment_amount: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Procedure / Notes</label>
              <textarea
                value={visitForm.visit_notes}
                onChange={(event) =>
                  setVisitForm((current) => ({ ...current, visit_notes: event.target.value }))
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                placeholder="Wire change, review, activation, patient feedback..."
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryMetric label="Case Total" value={formatCurrency(summary.net_fee)} tone="primary" />
                <SummaryMetric label="Paid Till Now" value={formatCurrency(summary.total_paid)} tone="success" />
                <SummaryMetric label="Projected Balance" value={formatCurrency(totalProjectedBalance)} tone="warning" />
              </div>
            </div>

            {visitPaymentAmount > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Payment Mode</label>
                  <select
                    value={visitForm.payment_mode}
                    onChange={(event) =>
                      setVisitForm((current) => ({ ...current, payment_mode: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                  Receipt, invoice, and payment entry will be created automatically for this payment.
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Enter `0` if this is only a follow-up visit. No receipt will be created until money is collected.
              </div>
            )}

            {!canCreateReceipts && (
              <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                You can log follow-up visits here. Payment collection needs invoice access so finance stays in sync.
              </div>
            )}

            {canManagePayouts && (
              <div className="rounded-xl border border-gray-200 p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={visitForm.commission_override}
                    onChange={(event) =>
                      setVisitForm((current) => ({
                        ...current,
                        commission_override: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Override commission for this visit
                </label>

                {visitForm.commission_override && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Commission Type</label>
                      <select
                        value={visitForm.commission_type}
                        onChange={(event) =>
                          setVisitForm((current) => ({
                            ...current,
                            commission_type: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                      >
                        <option value="Percentage">Percentage</option>
                        <option value="Fixed">Fixed</option>
                      </select>
                    </div>
                    <InputField
                      label="Commission Value"
                      type="number"
                      value={visitForm.commission_value}
                      onChange={(event) =>
                        setVisitForm((current) => ({
                          ...current,
                          commission_value: event.target.value,
                        }))
                      }
                    />
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Commission Basis</label>
                      <select
                        value={visitForm.commission_basis}
                        onChange={(event) =>
                          setVisitForm((current) => ({
                            ...current,
                            commission_basis: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                      >
                        <option value="On collected amount">On collected amount</option>
                        <option value="On net case value">On net case value</option>
                      </select>
                    </div>
                    <InputField
                      label="Commission Note"
                      value={visitForm.commission_note}
                      onChange={(event) =>
                        setVisitForm((current) => ({
                          ...current,
                          commission_note: event.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowVisitModal(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={addVisitMutation.isPending}>
                Save Visit
              </Button>
            </div>
          </form>
        </ModalShell>
      )}

      {showPayoutModal && summary?.case_id && canManagePayouts && (
        <ModalShell title="Record Commission Payout" onClose={() => setShowPayoutModal(false)}>
          <form className="space-y-5" onSubmit={handlePayoutSubmit}>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryMetric label="Accrued" value={formatCurrency(summary.total_commission_accrued)} />
                <SummaryMetric label="Already Paid" value={formatCurrency(summary.total_commission_paid)} tone="success" />
                <SummaryMetric label="Pending" value={formatCurrency(summary.pending_commission_amount)} tone="warning" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Paid Now"
                type="number"
                value={payoutForm.paid_amount}
                onChange={(event) =>
                  setPayoutForm((current) => ({ ...current, paid_amount: event.target.value }))
                }
              />
              <InputField
                label="Payout Date"
                type="date"
                value={payoutForm.posting_date}
                onChange={(event) =>
                  setPayoutForm((current) => ({ ...current, posting_date: event.target.value }))
                }
              />
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Payment Mode</label>
                <select
                  value={payoutForm.payment_mode}
                  onChange={(event) =>
                    setPayoutForm((current) => ({ ...current, payment_mode: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <InputField
                label="Reference No"
                value={payoutForm.reference_no}
                onChange={(event) =>
                  setPayoutForm((current) => ({ ...current, reference_no: event.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Notes</label>
              <textarea
                value={payoutForm.notes}
                onChange={(event) =>
                  setPayoutForm((current) => ({ ...current, notes: event.target.value }))
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                placeholder="Settlement notes or payout explanation..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowPayoutModal(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createPayoutMutation.isPending}>
                Save Payout
              </Button>
            </div>
          </form>
        </ModalShell>
      )}

      {showLedgerModal && summary?.case_id && (
        <ModalShell title="Orthodontic Ledger" onClose={() => setShowLedgerModal(false)}>
          <div className="space-y-4">
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" onClick={handlePrintCard}>
                Print Card
              </Button>
              {canManagePayouts && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowLedgerModal(false);
                    setShowFinanceModal(true);
                  }}
                >
                  Finance
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryMetric label="Balance" value={formatCurrency(summary.balance_amount)} tone="warning" />
                <SummaryMetric label="Collected" value={formatCurrency(summary.total_paid)} tone="success" />
                <SummaryMetric label="Next Visit" value={formatDate(summary.next_appointment_date)} />
              </div>
            </div>

            {ledgerLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : ledgerEntries.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                No orthodontic visits recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {ledgerEntries.map((entry) => (
                  <div
                    key={entry.ledger_entry_id}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatDate(entry.visit_date)}
                          </div>
                          <Badge variant={payoutVariant(entry.commission_status)} size="sm">
                            {entry.commission_status}
                          </Badge>
                          {entry.sales_invoice && (
                            <Badge variant="primary" size="sm">
                              Receipt linked
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {entry.visit_notes || 'No visit note added'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                          <span>Next: {formatDate(entry.next_appointment_date)}</span>
                          <span>Mode: {entry.payment_mode || 'Not set'}</span>
                          {entry.receipt_number && <span>Receipt: {entry.receipt_number}</span>}
                          {entry.consultant_name && (
                            <span>
                              Commission: {formatCurrency(entry.commission_amount)} · {entry.consultant_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:min-w-[220px]">
                        <SummaryMetric label="Payment" value={formatCurrency(entry.payment_amount)} tone="success" />
                        <SummaryMetric label="Balance" value={formatCurrency(entry.balance_after_entry)} tone="warning" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {showFinanceModal && summary?.case_id && canManagePayouts && (
        <ModalShell title="Orthodontic Finance" onClose={() => setShowFinanceModal(false)}>
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Commission Summary</div>
                  <div className="text-xs text-gray-500">
                    {summary.consultant_name || 'No consultant linked'} · {summary.commission_model || 'No model'}
                  </div>
                </div>
                <Badge variant={payoutVariant(summary.pending_commission_amount > 0 ? 'Unpaid' : 'Paid')} size="sm">
                  {summary.pending_commission_amount > 0 ? 'Pending' : 'Settled'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryMetric label="Accrued" value={formatCurrency(summary.total_commission_accrued)} />
                <SummaryMetric label="Paid" value={formatCurrency(summary.total_commission_paid)} tone="success" />
                <SummaryMetric label="Pending" value={formatCurrency(summary.pending_commission_amount)} tone="warning" />
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setShowFinanceModal(false);
                    setShowPayoutModal(true);
                  }}
                >
                  Mark Commission Paid
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-gray-900">Commission Payout History</div>
              {payoutsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : payoutEntries.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                  No commission payouts recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {payoutEntries.map((payout) => (
                    <div
                      key={payout.payout_id}
                      className="rounded-xl border border-gray-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(payout.paid_amount)}
                            </div>
                            <Badge variant={payout.status === 'Reversed' ? 'danger' : 'success'} size="sm">
                              {payout.status}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {formatDate(payout.posting_date)} · {payout.payment_mode || 'Payment mode not set'}
                            {payout.reference_no ? ` · ${payout.reference_no}` : ''}
                          </div>
                          {payout.notes && (
                            <div className="mt-2 text-sm text-gray-600">{payout.notes}</div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            {payout.allocations.length} linked ledger entr{payout.allocations.length === 1 ? 'y' : 'ies'}
                          </div>
                        </div>

                        {payout.status !== 'Reversed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReversePayout(payout)}
                            disabled={reversePayoutMutation.isPending}
                          >
                            Reverse
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </Card>
  );
};

export default OrthodonticTrackerPanel;
