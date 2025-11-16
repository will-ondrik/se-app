export interface Client {
  name: string;
}

export interface Note {
  content: string;
}

export interface Leads {
  firstName: string;
  lastName: string;
}

export interface Labour {
  projectedHours: number;
  actualHours: number;
  effectiveRate: number;
}

export interface Revenue {
  total: number;
  changeOrder: number;
}

export interface Profit {
  gross: number;
  grossVariance: number;
  net: number;
  netVariance: number;
}

export type BusinessTypeEnum = 
  | "cabinets"
  | "commercial"
  | "customer service"
  | "exteriors"
  | "new construction"
  | "renovations"
  | "repaint"
  | "shop";

export interface BusinessType {
  type: BusinessTypeEnum;
  billingMethod: "Quote" | "Cost Plus";
}

export interface Stages {
  stage1Lead: Leads;
  stage2Lead: Leads;
  stage3Lead: Leads;
  stage4Lead: Leads;
}

export interface Project {
  id: string;
  clientName: Client;
  lead: Leads;
  labour: Labour;
  revenue: Revenue;
  profit: Profit;
  businessType: BusinessType;
  stages: Stages;
  notes: Note;
  title: string;
  jobberNum: string;
  startDate: Date;
  endDate: Date;
  changeOrders: number;
  balanceDue: number;
}

export interface FilterState {
  dateRange: {
    from: Date | null;
    to: Date | null;
    preset: "all" | "yearly" | "quarterly" | "monthly" | "weekly" | "custom";
  };
  client: string | null;
  leader: string | null;
  businessType: string | null;
  billingType: string | null;
}