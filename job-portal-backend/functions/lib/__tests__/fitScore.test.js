"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../shared/validateEnv', () => ({ config: { CLAUDE_API_KEY: 'test-key' } }));
jest.mock('firebase-admin', () => ({
    firestore: { FieldValue: { serverTimestamp: () => 'SERVER_TS' } },
}));
jest.mock('firebase-functions', () => ({
    runWith: () => ({ firestore: { document: () => ({ onCreate: (h) => h }) } }),
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockGet = jest.fn();
const mockSubDoc = jest.fn().mockReturnValue({ id: 'tx-id' });
const mockSubColl = jest.fn().mockReturnValue({ doc: mockSubDoc });
const mockDocObj = { get: mockGet, update: mockUpdate, collection: mockSubColl };
const mockDocFn = jest.fn().mockReturnValue(mockDocObj);
const mockColl = jest.fn().mockReturnValue({ doc: mockDocFn });
const mockDb = { collection: mockColl, runTransaction: jest.fn() };
jest.mock('../shared/firebaseAdmin', () => ({ getFirestore: () => mockDb }));
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
})));
const fitScore_1 = require("../ai/fitScore");
const snap = (data, exists = true) => ({
    exists, data: () => data, ref: { update: mockUpdate },
});
const ctx = (applicationId = 'app1') => ({ params: { applicationId } });
const claudeReply = (input) => ({
    content: [{ type: 'tool_use', name: 'score_application', input }],
});
const resumeSnap = snap({ status: 'success', parsed: { skills: ['React'], experience: [] } });
const jdSnap = snap({ status: 'success', parsed_data: { title: 'Dev', requirements: [], skills: ['React'], experience_years: 2 } });
beforeEach(() => jest.clearAllMocks());
describe('fitScore', () => {
    test('saves error when userId missing', async () => {
        await fitScore_1.fitScore(snap({ jobId: 'j1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
    test('saves error when jobId missing', async () => {
        await fitScore_1.fitScore(snap({ userId: 'u1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
    test('saves error when resume not found', async () => {
        mockGet.mockResolvedValueOnce(snap(null, false)).mockResolvedValueOnce(jdSnap);
        await fitScore_1.fitScore(snap({ userId: 'u1', jobId: 'j1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
    test('saves error when resume status is not success', async () => {
        mockGet.mockResolvedValueOnce(snap({ status: 'error' })).mockResolvedValueOnce(jdSnap);
        await fitScore_1.fitScore(snap({ userId: 'u1', jobId: 'j1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
    test('saves error when JD not found', async () => {
        mockGet.mockResolvedValueOnce(resumeSnap).mockResolvedValueOnce(snap(null, false));
        await fitScore_1.fitScore(snap({ userId: 'u1', jobId: 'j1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
    test('saves error when Claude returns invalid fit_score', async () => {
        mockGet.mockResolvedValueOnce(resumeSnap).mockResolvedValueOnce(jdSnap);
        mockCreate.mockResolvedValueOnce(claudeReply({ fit_score: 150, matched_skills: [], missing_skills: [], recommendation: '' }));
        await fitScore_1.fitScore(snap({ userId: 'u1', jobId: 'j1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
    test('saves error when Claude returns non-JSON', async () => {
        mockGet.mockResolvedValueOnce(resumeSnap).mockResolvedValueOnce(jdSnap);
        mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'not json' }] });
        await fitScore_1.fitScore(snap({ userId: 'u1', jobId: 'j1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
    test('saves error when Claude API throws', async () => {
        mockGet.mockResolvedValueOnce(resumeSnap).mockResolvedValueOnce(jdSnap);
        mockCreate.mockRejectedValueOnce(new Error('API error'));
        await fitScore_1.fitScore(snap({ userId: 'u1', jobId: 'j1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
    test('updates with fit score on success', async () => {
        mockGet.mockResolvedValueOnce(resumeSnap).mockResolvedValueOnce(jdSnap);
        mockCreate.mockResolvedValueOnce(claudeReply({
            fit_score: 85, matched_skills: ['React'], missing_skills: ['Node'], recommendation: 'Strong match',
        }));
        await fitScore_1.fitScore(snap({ userId: 'u1', jobId: 'j1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            fit_score: 85, matched_skills: ['React'], missing_skills: ['Node'], status: 'success',
        }));
    });
    test('fit_score 0 is valid', async () => {
        mockGet.mockResolvedValueOnce(resumeSnap).mockResolvedValueOnce(jdSnap);
        mockCreate.mockResolvedValueOnce(claudeReply({ fit_score: 0, matched_skills: [], missing_skills: ['All'], recommendation: 'Poor fit' }));
        await fitScore_1.fitScore(snap({ userId: 'u1', jobId: 'j1' }), ctx());
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ fit_score: 0, status: 'success' }));
    });
});
//# sourceMappingURL=fitScore.test.js.map