import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

import OrthodonticTrackerPanel from './OrthodonticTrackerPanel';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('../../utils/printUtils', () => ({
  printHTML: jest.fn(),
}));

jest.mock('../../components/common/Portal', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

jest.mock('../../contexts/ClinicContext', () => ({
  useClinic: jest.fn(),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../hooks/usePractitioners', () => ({
  usePractitioners: jest.fn(),
}));

jest.mock('../../hooks/useOrthodontic', () => ({
  usePatientOrthodonticSummary: jest.fn(),
  useOrthodonticLedger: jest.fn(),
  useOrthodonticPayouts: jest.fn(),
  useCreateOrthodonticCase: jest.fn(),
  useUpdateOrthodonticCase: jest.fn(),
  useAddOrthodonticLedgerEntry: jest.fn(),
  useCreateOrthodonticPayout: jest.fn(),
  useReverseOrthodonticPayout: jest.fn(),
}));

jest.mock('../../api/services/clinicProfile', () => ({
  __esModule: true,
  clinicProfileService: {
    getClinicConsultants: jest.fn(),
  },
}));

jest.mock('../../api/services/orthodontic', () => ({
  orthodonticService: {
    getPrintData: jest.fn(),
  },
}));

const { useClinic } = jest.requireMock('../../contexts/ClinicContext');
const { useAuth } = jest.requireMock('../../contexts/AuthContext');
const { usePractitioners } = jest.requireMock('../../hooks/usePractitioners');
const orthodonticHooks = jest.requireMock('../../hooks/useOrthodontic');
const { clinicProfileService } = jest.requireMock('../../api/services/clinicProfile');

const mockSummary = {
  case_id: 'ORTHO-0001',
  company: 'Mob Clinic',
  patient_id: 'PAT-0001',
  patient_name: 'Amina',
  practitioner_id: 'PRAC-0001',
  practitioner_name: 'Dr Pooja Satheesh',
  case_type: 'Fixed Brace',
  package_fee: 15000,
  discount_amount: 0,
  discount_percentage: 0,
  advance_paid: 2000,
  net_fee: 15000,
  total_paid: 4400,
  balance_amount: 10600,
  next_appointment_date: '2026-04-16',
  last_visit_date: '2026-03-17',
  last_payment_date: '2026-03-17',
  status: 'Active',
  default_followup_days: 30,
  is_active: 1,
  consultant_id: 'CONS-0001',
  consultant_name: 'Aishwarya Lakshmi',
  consultant_type: 'Percentage',
  consultant_practitioner: 'PRAC-ORTHO',
  commission_model: 'Percentage',
  commission_type: 'Percentage',
  commission_value: 40,
  commission_basis: 'On collected amount',
  total_commission_accrued: 1760,
  total_commission_paid: 800,
  pending_commission_amount: 960,
  recent_ledger: [
    {
      ledger_entry_id: 'LED-0001',
      case_id: 'ORTHO-0001',
      visit_date: '2026-03-17',
      visit_notes: 'Wire change',
      payment_amount: 2400,
      payment_mode: 'Cash',
      balance_after_entry: 10600,
      next_appointment_date: '2026-04-16',
      sales_invoice: 'ACC-SINV-0001',
      payment_entry: 'ACC-PAY-0001',
      receipt_number: 'RCPT-0001',
      created_by: 'Administrator',
      is_adjustment: 0,
      commission_amount: 960,
      commission_value: 40,
      commission_status: 'Unpaid',
      commission_paid_amount: 0,
      consultant_name: 'Aishwarya Lakshmi',
    },
  ],
};

const mockMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
};

const findByText = (container, text) => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let currentNode = walker.currentNode;

  while (currentNode) {
    if (currentNode.textContent?.trim() === text) {
      return currentNode;
    }
    currentNode = walker.nextNode();
  }

  return null;
};

const clickButton = async (container, label) => {
  const button = Array.from(container.querySelectorAll('button')).find(
    (element) => element.textContent?.trim() === label
  );

  expect(button).toBeTruthy();

  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

describe('OrthodonticTrackerPanel', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();

    useClinic.mockReturnValue({ clinicId: 'CLINIC-0001' });
    useAuth.mockReturnValue({
      user: {
        practitioner_id: 'PRAC-0001',
        permissions: {
          is_clinic_admin: true,
          allowed_pages: ['invoice', 'financial_dashboard'],
        },
      },
      canAccessPage: (page) => ['invoice', 'financial_dashboard'].includes(page),
    });
    usePractitioners.mockReturnValue({ data: { data: [] } });
    clinicProfileService.getClinicConsultants.mockResolvedValue({ consultants: [] });

    orthodonticHooks.usePatientOrthodonticSummary.mockReturnValue({
      data: mockSummary,
      isLoading: false,
    });
    orthodonticHooks.useOrthodonticLedger.mockReturnValue({
      data: { ledger: mockSummary.recent_ledger },
      isLoading: false,
    });
    orthodonticHooks.useOrthodonticPayouts.mockReturnValue({
      data: { payouts: [] },
      isLoading: false,
    });
    orthodonticHooks.useCreateOrthodonticCase.mockReturnValue(mockMutation);
    orthodonticHooks.useUpdateOrthodonticCase.mockReturnValue(mockMutation);
    orthodonticHooks.useAddOrthodonticLedgerEntry.mockReturnValue(mockMutation);
    orthodonticHooks.useCreateOrthodonticPayout.mockReturnValue(mockMutation);
    orthodonticHooks.useReverseOrthodonticPayout.mockReturnValue(mockMutation);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('keeps the payment tab summary minimal and shows details only on demand', async () => {
    await act(async () => {
      root.render(<OrthodonticTrackerPanel patientId="PAT-0001" patientName="Amina" />);
    });

    expect(findByText(container, 'Orthodontic Tracker')).toBeTruthy();
    expect(findByText(container, 'Balance Amount')).toBeTruthy();
    expect(findByText(container, 'Orthodontic Ledger')).toBeNull();
    expect(findByText(container, 'Commission Summary')).toBeNull();
    expect(findByText(container, 'Mark Commission Paid')).toBeNull();

    await clickButton(container, 'View Details');

    expect(findByText(container, 'Orthodontic Ledger')).toBeTruthy();
    expect(findByText(container, 'Wire change')).toBeTruthy();

    await clickButton(container, 'Finance');

    expect(findByText(container, 'Orthodontic Finance')).toBeTruthy();
    expect(findByText(container, 'Commission Summary')).toBeTruthy();
    expect(findByText(container, 'Mark Commission Paid')).toBeTruthy();
  });
});
