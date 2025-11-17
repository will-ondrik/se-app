// Core domain types matching Go backend

export type Role = 
  | "EMPLOYEE"
  | "MANAGEMENT"
  | "ACCOUNTANT"
  | "BUSINESS_COACH"
  | "OWNER"
  | "CEO";

export type Permission = 
  | "VIEW_JOBS"
  | "EDIT_JOBS"
  | "VIEW_TOOLS"
  | "EDIT_TOOLS"
  | "VIEW_REPORTS"
  | "EDIT_REPORTS"
  | "VIEW_DASHBOARDS"
  | "VIEW_FINANCIALS"
  | "MANAGE_USERS"
  | "MANAGE_ROLES"
  | "MANAGE_SETTINGS"
  | "MANAGE_COMPANY"
  | "INVITE_USERS";

export interface User {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
}

export interface Session {
  id: string;
  userId: string;
  companyId: string;
  email: string;
  firstName: string;
  roles: Role[];
  permissions: Permission[];
  ttl: number;
}

export interface CompanyBrand {
  name: string;
  logo?: string;
}

export interface Coordinates {
  lat: string;
  long: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type ToolCondition = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "NEEDS_SERVICE";

export interface Tool {
  id: string;
  name: string;
  subCategoryId: string;
  isAvailable: boolean;
  lastServiced: string;
  assignedTo?: User;
  condition: ToolCondition;
  qrCodeId?: string;
  jobId?: string;
}

export type JobStatus = 
  | "DRAFT"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export interface Job {
  id: string;
  companyId: string;
  name: string;
  status: JobStatus;
  startDate: string;
  endDate: string;
  address: string;
  coordinates?: Coordinates;
  assignedCrewIds: string[];
  toolIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserInvite {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  invitedById: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}