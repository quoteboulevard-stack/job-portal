export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ApiError {
  message: string;
  code?:   string;
}

export interface PaginatedResult<T> {
  items:      T[];
  total:      number;
  hasMore:    boolean;
}
