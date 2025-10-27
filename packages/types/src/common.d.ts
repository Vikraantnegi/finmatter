/**
 * Common types used across the FinMatter application
 */
export type Currency = 'INR' | 'USD' | 'EUR';
export type TimeZone = 'Asia/Kolkata' | 'UTC';
export type Status = 'active' | 'inactive' | 'pending' | 'failed' | 'success';
export type SortOrder = 'asc' | 'desc';
export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
};
export type DateRange = {
  startDate: Date;
  endDate: Date;
};
export type Amount = {
  value: number;
  currency: Currency;
  formatted?: string;
};
export type Percentage = {
  value: number;
  formatted?: string;
};
export type ID = string | number;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type NonNullable<T> = T extends null | undefined ? never : T;
export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};
export type SoftDelete = {
  deletedAt?: Date;
  isDeleted?: boolean;
};
export type AuditFields = Timestamps & SoftDelete;
//# sourceMappingURL=common.d.ts.map
