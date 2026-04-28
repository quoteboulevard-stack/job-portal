import {
  createApplication,
  listApplicationsForUser,
  updateApplicationStatus,
} from '../services/applicationService';
import type { ApplicationCreatePayload } from '../types';

const mockDocs = (items: Record<string, unknown>[]) =>
  items.map((data, i) => ({ id: `app-${i}`, data: () => data }));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs:    jest.fn(),
  query:      jest.fn(),
  where:      jest.fn(),
}));

jest.mock('../../../shared/services/firebaseService', () => ({ db: {} }));

jest.mock('../../../shared/services/functionsService', () => ({
  callCreateApplication:      jest.fn(),
  callUpdateApplicationStatus: jest.fn(),
}));

const { getDocs } = jest.requireMock('firebase/firestore');
const { callCreateApplication, callUpdateApplicationStatus } =
  jest.requireMock('../../../shared/services/functionsService');

beforeEach(() => jest.clearAllMocks());

describe('listApplicationsForUser', () => {
  it('returns applications mapped to ApplicationRecord', async () => {
    getDocs.mockResolvedValueOnce({ empty: false, docs: mockDocs([
      { jobId: 'j1', jobTitle: 'Dev', company: 'Acme', applicantId: 'u1',
        employerId: 'e1', applicantName: 'Alice', applicantEmail: 'a@b.com', status: 'shortlisted' },
    ]) });
    const apps = await listApplicationsForUser('u1');
    expect(apps).toHaveLength(1);
    expect(apps[0].status).toBe('shortlisted');
  });

  it('falls back to legacy userId field when applicantId query is empty', async () => {
    getDocs
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({ empty: false, docs: mockDocs([
        { jobId: 'j2', jobTitle: 'QA', company: 'Corp', applicantId: '',
          employerId: 'e2', applicantName: 'Bob', applicantEmail: 'b@c.com', status: 'applied' },
      ]) });
    const apps = await listApplicationsForUser('u2');
    expect(apps).toHaveLength(1);
    expect(apps[0].status).toBe('applied');
  });

  it('normalises unknown status to "applied"', async () => {
    getDocs.mockResolvedValueOnce({ empty: false, docs: mockDocs([{ status: 'unknown_value' }]) });
    const [app] = await listApplicationsForUser('u1');
    expect(app.status).toBe('applied');
  });
});

describe('createApplication', () => {
  it('delegates to the callable and returns the applicationId', async () => {
    callCreateApplication.mockResolvedValueOnce({ success: true, applicationId: 'u1_j1' });
    const payload: ApplicationCreatePayload = {
      jobId: 'j1', jobTitle: 'Dev', company: 'Co', employerId: 'e1',
    };
    const id = await createApplication(payload);
    expect(id).toBe('u1_j1');
    expect(callCreateApplication).toHaveBeenCalledWith({
      jobId: 'j1', jobTitle: 'Dev', company: 'Co', employerId: 'e1',
    });
  });

  it('propagates callable errors to the caller', async () => {
    callCreateApplication.mockRejectedValueOnce(new Error('already-exists'));
    await expect(createApplication({ jobId: 'j1', jobTitle: 'Dev', company: 'Co', employerId: 'e1' }))
      .rejects.toThrow('already-exists');
  });
});

describe('updateApplicationStatus', () => {
  it('delegates to the callable', async () => {
    callUpdateApplicationStatus.mockResolvedValueOnce({ success: true, applicationId: 'app-1', status: 'shortlisted' });
    await updateApplicationStatus('app-1', 'shortlisted');
    expect(callUpdateApplicationStatus).toHaveBeenCalledWith({ applicationId: 'app-1', status: 'shortlisted' });
  });

  it('propagates callable errors to the caller', async () => {
    callUpdateApplicationStatus.mockRejectedValueOnce(new Error('permission-denied'));
    await expect(updateApplicationStatus('app-1', 'interview')).rejects.toThrow('permission-denied');
  });
});
