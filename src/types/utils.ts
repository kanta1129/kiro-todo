// Utility types for the application

// Make all properties optional except specified ones
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Make all properties required except specified ones
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;

// Extract function parameters
export type Parameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;

// Extract function return type
export type ReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : any;

// Create a type with only specified keys
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Create a type without specified keys
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Make specified properties nullable
export type Nullable<T, K extends keyof T> = {
  [P in K]: T[P] | null;
} & Omit<T, K>;

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Array element type
export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : never;

// Non-empty array type
export type NonEmptyArray<T> = [T, ...T[]];

// String literal union to array
export type UnionToArray<T> = T extends any ? T[] : never;

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>;

// Async function type
export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;

// ID types
export type ID = string;
export type UUID = string;
export type Timestamp = number;

// Status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type RequestStatus = 'pending' | 'fulfilled' | 'rejected';

// Generic API response type
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Generic pagination type
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// Sort and filter types
export type SortDirection = 'asc' | 'desc';
export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export type FilterConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

// Theme and styling types
export type ColorScheme = 'light' | 'dark' | 'auto';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

// Component state types
export interface ComponentState {
  isLoading: boolean;
  isDisabled: boolean;
  isVisible: boolean;
  hasError: boolean;
}

// Form validation types
export interface ValidationRule<T = any> {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean | string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}