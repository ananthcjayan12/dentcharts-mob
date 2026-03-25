import { prescriptionService } from './prescription';
import { apiClient } from '../client';

jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  API_ENDPOINTS: {
    PRESCRIPTIONS: {
      CREATE: '/create',
      GET: '/get',
      LIST: '/list',
      UPDATE: '/update',
      DELETE: '/delete',
      SHARE: '/share',
      PATIENT_HISTORY: '/history',
    },
  },
}));

describe('prescriptionService date normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps patient prescription_date into the shared display date fields', async () => {
    apiClient.get.mockResolvedValue({
      message: 'success',
      data: [
        {
          name: 'RX-0001',
          patient: 'PAT-0001',
          patient_name: 'Test Patient',
          prescription_date: '2026-03-10',
          status: 'Draft',
        },
      ],
    });

    const prescriptions = await prescriptionService.getPatientPrescriptions('PAT-0001');

    expect(prescriptions).toHaveLength(1);
    expect(prescriptions[0].prescription_date).toBe('2026-03-10');
    expect(prescriptions[0].posting_date).toBe('2026-03-10');
    expect(prescriptionService.resolvePrescriptionDate(prescriptions[0])).toBe('2026-03-10');
  });
});
