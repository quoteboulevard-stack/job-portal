import { fetchJobsPage, fetchJobById, createJob } from '../services/jobService';
import type { JobDraft } from '../types';

const mockDocs = (items: Record<string, unknown>[]) =>
  items.map((data, i) => ({ id: `job-${i}`, data: () => data, exists: () => true }));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc:        jest.fn(),
  getDoc:     jest.fn(),
  getDocs:    jest.fn(),
  orderBy:    jest.fn(),
  limit:      jest.fn(),
  startAfter: jest.fn(),
  query:      jest.fn((...args: unknown[]) => args),
}));

jest.mock('../../../shared/services/firebaseService', () => ({ db: {} }));

jest.mock('../../../shared/services/functionsService', () => ({
  callCreateJob: jest.fn(),
}));

const { getDocs, getDoc } = jest.requireMock('firebase/firestore');
const { callCreateJob }   = jest.requireMock('../../../shared/services/functionsService');

beforeEach(() => jest.clearAllMocks());

describe('fetchJobsPage', () => {
  it('maps Firestore documents to a JobPage', async () => {
    getDocs.mockResolvedValueOnce({ docs: mockDocs([
      { title: 'Engineer', company: 'Acme', location: 'NYC', workMode: 'onsite', employmentType: 'fulltime',
        salary: 120000, description: 'Desc', requirements: [], skills: ['TypeScript'],
        experience: 'senior', perks: [], employerId: 'emp-1' },
    ]) });
    const { jobs, hasMore } = await fetchJobsPage();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Engineer');
    expect(jobs[0].skills).toEqual(['TypeScript']);
    expect(hasMore).toBe(false);
  });

  it('returns empty page when collection is empty', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    const { jobs, hasMore, lastJobId } = await fetchJobsPage();
    expect(jobs).toEqual([]);
    expect(hasMore).toBe(false);
    expect(lastJobId).toBeNull();
  });

  it('sets hasMore:true and trims to PAGE_SIZE when Firestore returns PAGE_SIZE+1 docs', async () => {
    // 21 docs signals there are more beyond the page
    const items = Array.from({ length: 21 }, (_, i) => ({ title: `Job ${i}`, id: `job-${i}` }));
    getDocs.mockResolvedValueOnce({ docs: mockDocs(items) });
    const { jobs, hasMore } = await fetchJobsPage();
    expect(jobs).toHaveLength(20);
    expect(hasMore).toBe(true);
  });

  it('maps legacy mode:"remote" to workMode:remote, employmentType:fulltime', async () => {
    getDocs.mockResolvedValueOnce({ docs: mockDocs([{ mode: 'remote' }]) });
    const { jobs } = await fetchJobsPage();
    expect(jobs[0].workMode).toBe('remote');
    expect(jobs[0].employmentType).toBe('fulltime');
  });

  it('maps legacy mode:"internship" to workMode:onsite, employmentType:internship', async () => {
    getDocs.mockResolvedValueOnce({ docs: mockDocs([{ mode: 'internship' }]) });
    const { jobs } = await fetchJobsPage();
    expect(jobs[0].workMode).toBe('onsite');
    expect(jobs[0].employmentType).toBe('internship');
  });

  it('normalises unknown mode to workMode:onsite, employmentType:fulltime', async () => {
    getDocs.mockResolvedValueOnce({ docs: mockDocs([{ mode: 'unknown' }]) });
    const { jobs } = await fetchJobsPage();
    expect(jobs[0].workMode).toBe('onsite');
    expect(jobs[0].employmentType).toBe('fulltime');
  });

  it('fetches cursor doc then queries next page when lastJobId provided', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, id: 'job-cursor' });
    getDocs.mockResolvedValueOnce({ docs: mockDocs([{ title: 'Next' }]) });
    const { jobs } = await fetchJobsPage('job-cursor');
    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(jobs[0].title).toBe('Next');
  });
});

describe('fetchJobById', () => {
  it('returns null when the document does not exist', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    expect(await fetchJobById('missing')).toBeNull();
  });

  it('maps an existing document to a JobRecord', async () => {
    getDoc.mockResolvedValueOnce({
      id: 'job-abc', exists: () => true,
      data: () => ({ title: 'Designer', company: 'Co', location: 'SF',
        workMode: 'remote', employmentType: 'fulltime',
        description: 'D', requirements: [], skills: [],
        experience: 'mid', perks: [], employerId: 'emp-2' }),
    });
    const job = await fetchJobById('job-abc');
    expect(job?.title).toBe('Designer');
    expect(job?.workMode).toBe('remote');
    expect(job?.employmentType).toBe('fulltime');
  });
});

describe('createJob', () => {
  it('delegates to the callable and returns the jobId', async () => {
    callCreateJob.mockResolvedValueOnce({ success: true, jobId: 'new-job-id' });
    const draft: JobDraft = {
      title: 'PM', company: 'Corp', location: 'London',
      workMode: 'hybrid', employmentType: 'fulltime',
      description: 'Desc', requirements: [], skills: [], experience: 'mid', perks: [],
    };
    const id = await createJob(draft);
    expect(id).toBe('new-job-id');
    expect(callCreateJob).toHaveBeenCalledWith(expect.objectContaining({
      title: 'PM', company: 'Corp', workMode: 'hybrid', employmentType: 'fulltime',
    }));
  });

  it('propagates callable errors to the caller', async () => {
    callCreateJob.mockRejectedValueOnce(new Error('permission-denied'));
    await expect(createJob({
      title: 'PM', company: 'Corp', location: 'London',
      workMode: 'hybrid', employmentType: 'fulltime',
      description: 'Desc', requirements: [], skills: [], experience: 'mid', perks: [],
    })).rejects.toThrow('permission-denied');
  });
});
