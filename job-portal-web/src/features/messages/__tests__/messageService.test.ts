import {
  listMessageRequestsForUser,
  listConversationsForUser,
  listPendingEmployerMessages,
  sendChatMessage,
} from '../services/messageService';

let _idCounter = 0;
const mockDocs = (items: Record<string, unknown>[]) =>
  items.map((data) => ({ id: `doc-${_idCounter++}`, data: () => data }));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc:        jest.fn(),
  getDocs:    jest.fn(),
  onSnapshot: jest.fn(),
  query:      jest.fn(),
  where:      jest.fn(),
  orderBy:    jest.fn(),
}));

jest.mock('../../../shared/services/firebaseService', () => ({ db: {} }));
jest.mock('../../../shared/services/functionsService', () => ({
  callAcceptMessage:   jest.fn(),
  callRejectMessage:   jest.fn(),
  callRequestMessage:  jest.fn(),
  callSendChatMessage: jest.fn(),
}));

const { getDocs } = jest.requireMock('firebase/firestore');
const { callSendChatMessage } = jest.requireMock('../../../shared/services/functionsService');

beforeEach(() => { jest.clearAllMocks(); _idCounter = 0; });

describe('listMessageRequestsForUser', () => {
  it('merges sent and received messages without duplicates', async () => {
    getDocs
      .mockResolvedValueOnce({ docs: mockDocs([{ fromUserId: 'u1', toUserId: 'u2', status: 'waiting', creditCost: 1 }]) })
      .mockResolvedValueOnce({ docs: mockDocs([{ fromUserId: 'u3', toUserId: 'u1', status: 'accepted', creditCost: 1 }]) });
    const results = await listMessageRequestsForUser('u1');
    expect(results).toHaveLength(2);
  });

  it('deduplicates a document that appears in both queries', async () => {
    const sharedDoc = { id: 'shared', data: () => ({ fromUserId: 'u1', toUserId: 'u1', status: 'waiting', creditCost: 1 }) };
    getDocs
      .mockResolvedValueOnce({ docs: [sharedDoc] })
      .mockResolvedValueOnce({ docs: [sharedDoc] });
    const results = await listMessageRequestsForUser('u1');
    expect(results).toHaveLength(1);
  });

  it('normalises unknown status to "waiting"', async () => {
    getDocs
      .mockResolvedValueOnce({ docs: mockDocs([{ fromUserId: 'u1', status: 'UNKNOWN' }]) })
      .mockResolvedValueOnce({ docs: [] });
    const [msg] = await listMessageRequestsForUser('u1');
    expect(msg.status).toBe('waiting');
  });
});

describe('listPendingEmployerMessages', () => {
  it('returns only waiting or seen messages addressed to the employer', async () => {
    getDocs
      .mockResolvedValueOnce({ docs: mockDocs([
        { fromUserId: 'seeker', toUserId: 'emp1', status: 'waiting', creditCost: 1 },
        { fromUserId: 'seeker', toUserId: 'emp1', status: 'accepted', creditCost: 1 },
      ]) })
      .mockResolvedValueOnce({ docs: [] });
    const results = await listPendingEmployerMessages('emp1');
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('waiting');
  });
});

describe('listConversationsForUser', () => {
  it('uses employerId field for employer role', async () => {
    getDocs.mockResolvedValueOnce({ docs: mockDocs([
      { employerId: 'emp1', jobSeekerId: 'seeker1', title: 'Chat', lastMessage: 'Hi' },
    ]) });
    const results = await listConversationsForUser('emp1', 'employer');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Chat');
  });

  it('uses jobSeekerId field for job_seeker role', async () => {
    getDocs.mockResolvedValueOnce({ docs: mockDocs([
      { employerId: 'emp1', jobSeekerId: 'seeker1', title: 'Chat 2', lastMessage: 'Hello' },
    ]) });
    const results = await listConversationsForUser('seeker1', 'job_seeker');
    expect(results).toHaveLength(1);
  });
});

describe('sendChatMessage', () => {
  it('delegates to the callable with the trimmed text', async () => {
    callSendChatMessage.mockResolvedValueOnce({ success: true, messageId: 'msg-1' });
    await sendChatMessage('conv-1', '  Hello!  ');
    expect(callSendChatMessage).toHaveBeenCalledWith({ conversationId: 'conv-1', text: 'Hello!' });
  });

  it('does nothing when text is blank', async () => {
    await sendChatMessage('conv-1', '   ');
    expect(callSendChatMessage).not.toHaveBeenCalled();
  });

  it('propagates callable errors to the caller', async () => {
    callSendChatMessage.mockRejectedValueOnce(new Error('permission-denied'));
    await expect(sendChatMessage('conv-1', 'Hi')).rejects.toThrow('permission-denied');
  });
});
