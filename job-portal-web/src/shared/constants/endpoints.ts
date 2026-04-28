export const COLLECTIONS = {
  USERS:         'users',
  JOBS:          'jobs',
  APPLICATIONS:  'applications',
  MESSAGES:      'messages',
  CONVERSATIONS: 'conversations',
  NOTIFICATIONS: 'notifications',
  RESUMES:       'resumes',
} as const;

export const SUBCOLLECTIONS = {
  CHAT_MESSAGES:       'messages',
  CREDIT_TRANSACTIONS: 'credit_transactions',
} as const;
