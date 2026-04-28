import { fetchCreditSummary, creditPackages, purchaseCredits } from '../services/creditService';

jest.mock('firebase/firestore', () => ({
  doc:    jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('../../../shared/services/firebaseService', () => ({ db: {} }));
jest.mock('../../../shared/services/functionsService', () => ({
  callCreateCreditCheckoutSession: jest.fn(),
}));

const { getDoc } = jest.requireMock('firebase/firestore');
const { callCreateCreditCheckoutSession } = jest.requireMock('../../../shared/services/functionsService');

beforeEach(() => jest.clearAllMocks());

describe('creditPackages', () => {
  it('contains three packages', () => {
    expect(creditPackages).toHaveLength(3);
  });
  it('all packages have required fields with positive credits', () => {
    creditPackages.forEach((pkg) => {
      expect(pkg).toHaveProperty('id');
      expect(pkg.credits).toBeGreaterThan(0);
    });
  });
});

describe('fetchCreditSummary', () => {
  it('returns balance and totalAdded from Firestore', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ balance: 15, totalAdded: 40 }) });
    const summary = await fetchCreditSummary('user-1');
    expect(summary.available).toBe(15);
    expect(summary.totalAdded).toBe(40);
  });

  it('returns zeros when user document does not exist', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    const summary = await fetchCreditSummary('missing-user');
    expect(summary.available).toBe(0);
    expect(summary.totalAdded).toBe(0);
  });

  it('returns zeros when fields are missing', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({}) });
    const summary = await fetchCreditSummary('partial-user');
    expect(summary.available).toBe(0);
  });
});

describe('purchaseCredits', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000', assign: jest.fn() },
      writable: true,
    });
  });

  it('redirects to the Stripe URL on success', async () => {
    callCreateCreditCheckoutSession.mockResolvedValueOnce({ url: 'https://stripe.test/pay' });
    await purchaseCredits('user-1', creditPackages[0]);
    expect(window.location.assign).toHaveBeenCalledWith('https://stripe.test/pay');
  });

  it('throws when userId is empty', async () => {
    await expect(purchaseCredits('', creditPackages[0])).rejects.toThrow('Sign in');
  });

  it('throws when no checkout URL is returned', async () => {
    callCreateCreditCheckoutSession.mockResolvedValueOnce({ url: '' });
    await expect(purchaseCredits('user-1', creditPackages[0])).rejects.toThrow('checkout session');
  });
});
