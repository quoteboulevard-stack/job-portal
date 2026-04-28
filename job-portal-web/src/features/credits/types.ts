export interface CreditPackageRecord {
  id: string;
  name: string;
  credits: number;
  price: string;
}

export interface CreditSummary {
  available: number;
  totalAdded: number;
}
