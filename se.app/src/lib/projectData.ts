import { Project } from "@/types/project";
import projectsData from "../../kpi_projects_data.json";

// Import and process the JSON data
export const projects: Project[] = projectsData.map((project: any, index: number) => ({
  ...project,
  id: (index + 1).toString(),
  startDate: new Date(project.startDate),
  endDate: new Date(project.endDate),
  // Normalize business type to match enum (lowercase)
  businessType: {
    ...project.businessType,
    type: project.businessType.type.toLowerCase()
  },
  // Round labour hours to 1 decimal place
  labour: {
    ...project.labour,
    projectedHours: Math.round(project.labour.projectedHours * 10) / 10,
    actualHours: Math.round(project.labour.actualHours * 10) / 10
  }
}));

// Helper function to filter projects based on FilterState
export const filterProjects = (projects: Project[], filters: any) => {
  return projects.filter((project) => {
    // Date range filter
    if (filters.dateRange?.from && filters.dateRange?.to) {
      if (
        project.startDate < filters.dateRange.from ||
        project.startDate > filters.dateRange.to
      ) {
        return false;
      }
    }

    // Client filter
    if (filters.client && project.clientName.name !== filters.client) {
      return false;
    }

    // Leader filter
    if (
      filters.leader &&
      `${project.lead.firstName} ${project.lead.lastName}` !== filters.leader
    ) {
      return false;
    }

    // Business type filter
    if (filters.businessType && project.businessType.type !== filters.businessType) {
      return false;
    }

    // Billing type filter
    if (filters.billingType && project.businessType.billingMethod !== filters.billingType) {
      return false;
    }

    return true;
  });
};