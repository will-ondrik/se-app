import { Project, FilterState } from "@/types/kpi_dashboard/types";

export const filterProjects = (projects: Project[], filters: Partial<FilterState> | any) => {
  return projects.filter((project) => {
    // Date range filter
    if (filters?.dateRange?.from && filters?.dateRange?.to) {
      if (
        project.startDate < filters.dateRange.from ||
        project.startDate > filters.dateRange.to
      ) {
        return false;
      }
    }

    // Client filter
    if (filters?.client && project.clientName.name !== filters.client) {
      return false;
    }

    // Leader filter
    if (
      filters?.leader &&
      `${project.lead.firstName} ${project.lead.lastName}` !== filters.leader
    ) {
      return false;
    }

    // Business type filter
    if (filters?.businessType && project.businessType.type !== filters.businessType) {
      return false;
    }

    // Billing type filter
    if (filters?.billingType && project.businessType.billingMethod !== filters.billingType) {
      return false;
    }

    return true;
  });
};
