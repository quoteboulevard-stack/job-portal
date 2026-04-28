export interface CallableResult<T> {
  success: boolean;
  data?:   T;
  error?:  string;
}

export interface FirestoreTimestamp {
  toDate: () => Date;
}
