"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('firebase-admin', () => ({
    firestore: { FieldValue: { serverTimestamp: () => 'SERVER_TS' } },
}));
jest.mock('firebase-functions', () => ({
    runWith: () => ({ firestore: { document: () => ({ onUpdate: (h) => h }) } }),
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockSet = jest.fn().mockResolvedValue(undefined);
const mockTxGet = jest.fn();
const mockTx = { get: mockTxGet, update: jest.fn(), set: jest.fn() };
const mockSubDoc = jest.fn().mockReturnValue({ id: 'tx-id' });
const mockSubColl = jest.fn().mockReturnValue({ doc: mockSubDoc });
const mockDocObj = { update: mockUpdate, set: mockSet, collection: mockSubColl };
const mockDocFn = jest.fn().mockReturnValue(mockDocObj);
const mockColl = jest.fn().mockReturnValue({ doc: mockDocFn });
const mockRunTx = jest.fn().mockImplementation((cb) => cb(mockTx));
const mockDb = { collection: mockColl, runTransaction: mockRunTx };
jest.mock('../shared/firebaseAdmin', () => ({ getFirestore: () => mockDb }));
const deductCredit_1 = require("../credits/deductCredit");
const makeChange = (before, after) => ({
    before: { data: () => before },
    after: { data: () => after, ref: { update: mockUpdate } },
});
const ctx = (messageId = 'msg1') => ({ params: { messageId } });
const userSnap = (balance, exists = true) => ({
    exists, data: () => ({ balance, totalAdded: 10, updatedAt: 'SERVER_TS' }),
});
beforeEach(() => jest.clearAllMocks());
describe('deductCredit', () => {
    test('ignores non sent→seen transitions', async () => {
        await deductCredit_1.deductCredit(makeChange({ status: 'sent' }, { status: 'expired', senderId: 'u1' }), ctx());
        expect(mockRunTx).not.toHaveBeenCalled();
    });
    test('ignores already-deducted messages', async () => {
        await deductCredit_1.deductCredit(makeChange({ status: 'sent' }, { status: 'seen', senderId: 'u1', creditDeducted: true }), ctx());
        expect(mockRunTx).not.toHaveBeenCalled();
    });
    test('ignores reverse transition (seen→sent)', async () => {
        await deductCredit_1.deductCredit(makeChange({ status: 'seen' }, { status: 'sent', senderId: 'u1' }), ctx());
        expect(mockRunTx).not.toHaveBeenCalled();
    });
    test('returns early when senderId is missing', async () => {
        await deductCredit_1.deductCredit(makeChange({ status: 'sent' }, { status: 'seen' }), ctx());
        expect(mockRunTx).not.toHaveBeenCalled();
    });
    test('marks creditError on insufficient credits (balance 0)', async () => {
        mockTxGet.mockResolvedValueOnce(userSnap(0));
        await deductCredit_1.deductCredit(makeChange({ status: 'sent' }, { status: 'seen', senderId: 'u1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ creditDeducted: false, creditError: 'insufficient_credits' }));
        expect(mockTx.update).not.toHaveBeenCalled();
    });
    test('marks creditError on insufficient credits (balance negative)', async () => {
        mockTxGet.mockResolvedValueOnce(userSnap(-5));
        await deductCredit_1.deductCredit(makeChange({ status: 'sent' }, { status: 'seen', senderId: 'u1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ creditError: 'insufficient_credits' }));
    });
    test('throws when user document not found (triggers retry)', async () => {
        mockTxGet.mockResolvedValueOnce({ exists: false, data: () => null });
        await expect(deductCredit_1.deductCredit(makeChange({ status: 'sent' }, { status: 'seen', senderId: 'u1' }), ctx())).rejects.toThrow('User document not found');
    });
    test('throws and propagates unexpected transaction errors (triggers retry)', async () => {
        mockRunTx.mockRejectedValueOnce(new Error('Firestore quota exceeded'));
        await expect(deductCredit_1.deductCredit(makeChange({ status: 'sent' }, { status: 'seen', senderId: 'u1' }), ctx())).rejects.toThrow('Firestore quota exceeded');
    });
    test('deducts credit and logs transaction on success', async () => {
        mockTxGet.mockResolvedValueOnce(userSnap(3));
        await deductCredit_1.deductCredit(makeChange({ status: 'sent' }, { status: 'seen', senderId: 'u1' }), ctx());
        expect(mockTx.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ balance: 2 }));
        expect(mockTx.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: 'deduction', amount: 1, balanceAfter: 2, reason: 'message_viewed' }));
        expect(mockTx.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ creditDeducted: true }));
    });
    test('deducts correctly when balance is exactly 1', async () => {
        mockTxGet.mockResolvedValueOnce(userSnap(1));
        await deductCredit_1.deductCredit(makeChange({ status: 'sent' }, { status: 'seen', senderId: 'u1' }), ctx());
        expect(mockTx.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ balance: 0 }));
    });
});
//# sourceMappingURL=creditDeduction.test.js.map