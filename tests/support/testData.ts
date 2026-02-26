export const testTag = `E2E_${Date.now()}`;

export const patientFactory = () => ({
  first_name: `E2E${Date.now()}`,
  last_name: 'Release',
  sex: 'Male' as const,
  dob: '1992-01-01',
  mobile: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
  address: `Tagged-${testTag}`,
});
