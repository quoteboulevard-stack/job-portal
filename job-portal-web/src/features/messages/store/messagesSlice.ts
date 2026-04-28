import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ConversationRecord, MessageRequestRecord } from '../types';

interface MessagesState {
  requests:      MessageRequestRecord[];
  conversations: ConversationRecord[];
  loading:       boolean;
  error:         string | null;
}

const initialState: MessagesState = {
  requests:      [],
  conversations: [],
  loading:       false,
  error:         null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setRequests(state, action: PayloadAction<MessageRequestRecord[]>)  { state.requests      = action.payload; },
    setConversations(state, action: PayloadAction<ConversationRecord[]>){ state.conversations = action.payload; },
    setLoading(state, action: PayloadAction<boolean>)                  { state.loading       = action.payload; },
    setError(state, action: PayloadAction<string | null>)              { state.error         = action.payload; },
  },
});

export const { setRequests, setConversations, setLoading, setError } = messagesSlice.actions;
export default messagesSlice.reducer;
