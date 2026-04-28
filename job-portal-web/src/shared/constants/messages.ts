export const AUTH_MESSAGES = {
  LOGIN_SUCCESS:          'Welcome back!',
  SIGNUP_SUCCESS:         'Account created successfully.',
  LOGOUT_SUCCESS:         'You have been signed out.',
  PASSWORD_RESET_SENT:    'Password reset email sent. Check your inbox.',
  PROFILE_UPDATED:        'Profile updated successfully.',
} as const;

export const JOB_MESSAGES = {
  JOB_POSTED:             'Job posted successfully.',
  APPLICATION_SUBMITTED:  'Application submitted.',
  ALREADY_APPLIED:        'You have already applied for this job.',
} as const;

export const MESSAGE_MESSAGES = {
  REQUEST_SENT:           'Message request sent.',
  REQUEST_ACCEPTED:       'Message request accepted.',
  REQUEST_REJECTED:       'Message request declined.',
  INSUFFICIENT_CREDITS:   'You do not have enough credits to send this message.',
} as const;

export const CREDIT_MESSAGES = {
  PURCHASE_SUCCESS:       'Credits added to your account.',
  PURCHASE_FAILED:        'Purchase could not be completed. Please try again.',
} as const;

export const GENERIC_MESSAGES = {
  LOADING:                'Loading…',
  SOMETHING_WENT_WRONG:   'Something went wrong. Please try again.',
  NOT_FOUND:              'The page you are looking for does not exist.',
  UNAUTHORIZED:           'You must be signed in to view this page.',
  FORBIDDEN:              'You do not have permission to view this page.',
} as const;
