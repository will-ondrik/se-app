import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Project } from "@/types/project";

interface PDFSection {
  id: string;
  label: string;
  checked: boolean;
}

interface PDFData {
  companyName: string;
  filters: any;
  sections: PDFSection[];
  kpis: any;
  projects: Project[];
  advancedAnalytics?: any;
  leaderMetrics?: any[];
  chartRefs?: {
    revenue?: HTMLElement | null;
    changeOrders?: HTMLElement | null;
    businessMix?: HTMLElement | null;
    labour?: HTMLElement | null;
  };
}

export async function generatePDF(data: PDFData): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (heightNeeded: number) => {
    if (yPosition + heightNeeded > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Add title page
  pdf.setFontSize(28);
  pdf.setTextColor(31, 41, 55);
  pdf.text(data.companyName, pageWidth / 2, 60, { align: "center" });
  
  pdf.setFontSize(18);
  pdf.setTextColor(107, 114, 128);
  pdf.text("CEO KPI Dashboard Report", pageWidth / 2, 75, { align: "center" });
  
  pdf.setFontSize(12);
  pdf.setTextColor(156, 163, 175);
  const date = new Date().toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
  pdf.text(date, pageWidth / 2, 85, { align: "center" });

  // Add filter summary
  const filterSummary = getFilterSummary(data.filters);
  pdf.setFontSize(10);
  pdf.text(`Report Scope: ${filterSummary}`, pageWidth / 2, 95, { align: "center" });

  pdf.addPage();
  yPosition = margin;

  // Executive Summary AI Section
  if (data.sections.find(s => s.id === "executiveSummary")?.checked) {
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Executive Summary", margin, yPosition);
    yPosition += 10;
    
    pdf.setFillColor(255, 243, 205);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40, "F");
    
    pdf.setFontSize(10);
    pdf.setTextColor(146, 64, 14);
    pdf.text("[AI-Generated Summary Section]", margin + 5, yPosition + 7);
    pdf.setFontSize(9);
    pdf.setTextColor(92, 45, 9);
    pdf.text("This section will contain an AI-generated executive summary highlighting:", margin + 5, yPosition + 15);
    pdf.text("• Overall business performance and key trends", margin + 5, yPosition + 22);
    pdf.text("• Critical metrics and anomalies requiring attention", margin + 5, yPosition + 28);
    pdf.text("• High-level strategic insights and recommendations", margin + 5, yPosition + 34);
    
    yPosition += 50;
  }

  // Overview KPIs
  if (data.sections.find(s => s.id === "overview")?.checked) {
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Key Performance Indicators", margin, yPosition);
    yPosition += 10;

    const kpiData = [
      { label: "Total Revenue", value: formatCurrency(data.kpis.totalRevenue.value) },
      { label: "Gross Profit", value: formatCurrency(data.kpis.grossProfit.value) },
      { label: "Net Profit", value: formatCurrency(data.kpis.netProfit.value) },
      { label: "Change Orders", value: data.kpis.changeOrderCount.value.toString() },
      { label: "Change Order Revenue", value: formatCurrency(data.kpis.changeOrderRevenue.value) },
      { label: "Labour Hours (Actual)", value: formatNumber(data.kpis.projectedVsActual.actual) },
      { label: "Effective Rate", value: `$${data.kpis.effectiveRate.value.toFixed(2)}/hr` },
    ];

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    
    let row = 0;
    const colWidth = (pageWidth - 2 * margin) / 2;
    kpiData.forEach((kpi, index) => {
      const col = index % 2;
      const x = margin + col * colWidth;
      const y = yPosition + Math.floor(index / 2) * 12;
      
      pdf.setFont(undefined, "bold");
      pdf.text(kpi.label + ":", x, y);
      pdf.setFont(undefined, "normal");
      pdf.text(kpi.value, x + 60, y);
    });

    yPosition += Math.ceil(kpiData.length / 2) * 12 + 10;
  }

  // Overview Insights AI Section
  if (data.sections.find(s => s.id === "overviewInsights")?.checked) {
    checkPageBreak(45);
    
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Overview Insights", margin, yPosition);
    yPosition += 8;
    
    pdf.setFillColor(219, 234, 254);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35, "F");
    
    pdf.setFontSize(10);
    pdf.setTextColor(30, 58, 138);
    pdf.text("[AI-Generated KPI Analysis]", margin + 5, yPosition + 7);
    pdf.setFontSize(9);
    pdf.setTextColor(30, 64, 175);
    pdf.text("AI analysis will provide insights on:", margin + 5, yPosition + 15);
    pdf.text("• Revenue performance vs historical trends and forecasts", margin + 5, yPosition + 21);
    pdf.text("• Profit margin analysis and cost optimization opportunities", margin + 5, yPosition + 27);
    
    yPosition += 45;
  }

  // Capture and add charts
  if (data.chartRefs) {
    const chartSections = [
      { id: "trends", ref: data.chartRefs.revenue, title: "Revenue & Profit Trends" },
      { id: "changeOrders", ref: data.chartRefs.changeOrders, title: "Change Orders Analysis" },
      { id: "businessMix", ref: data.chartRefs.businessMix, title: "Business Mix" },
      { id: "labour", ref: data.chartRefs.labour, title: "Labour Efficiency" },
    ];

    for (const chart of chartSections) {
      if (data.sections.find(s => s.id === chart.id)?.checked && chart.ref) {
        checkPageBreak(100);
        
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.text(chart.title, margin, yPosition);
        yPosition += 8;

        try {
          const canvas = await html2canvas(chart.ref, { 
            scale: 2,
            backgroundColor: "#ffffff"
          });
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          checkPageBreak(imgHeight);
          pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error("Error capturing chart:", error);
        }
      }
    }
  }

  // Chart Insights AI Section
  if (data.sections.find(s => s.id === "chartInsights")?.checked) {
    checkPageBreak(45);
    
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Chart Analysis", margin, yPosition);
    yPosition += 8;
    
    pdf.setFillColor(220, 252, 231);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35, "F");
    
    pdf.setFontSize(10);
    pdf.setTextColor(20, 83, 45);
    pdf.text("[AI-Generated Chart Insights]", margin + 5, yPosition + 7);
    pdf.setFontSize(9);
    pdf.setTextColor(22, 101, 52);
    pdf.text("AI will analyze visual trends including:", margin + 5, yPosition + 15);
    pdf.text("• Revenue patterns, seasonality, and growth trajectories", margin + 5, yPosition + 21);
    pdf.text("• Change order frequency and impact on profitability", margin + 5, yPosition + 27);
    
    yPosition += 45;
  }

  // Advanced Analytics
  if (data.sections.find(s => s.id === "advanced")?.checked && data.advancedAnalytics) {
    checkPageBreak(20);
    
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Advanced Analytics", margin, yPosition);
    yPosition += 10;

    const advancedMetrics = [
      { label: "Efficiency Index", value: data.advancedAnalytics.efficiencyIndex?.toFixed(2) || "N/A" },
      { label: "Profit per Hour", value: formatCurrency(data.advancedAnalytics.profitPerHour || 0) },
      { label: "Gross Margin", value: `${(data.advancedAnalytics.grossMargin || 0).toFixed(1)}%` },
      { label: "Net Margin", value: `${(data.advancedAnalytics.netMargin || 0).toFixed(1)}%` },
      { label: "Cost Overrun Index", value: data.advancedAnalytics.overrunIndex?.toFixed(2) || "N/A" },
      { label: "Avg Project Duration", value: `${data.advancedAnalytics.avgProjectDuration || 0} days` },
      { label: "Change Order Rate", value: `${(data.advancedAnalytics.changeOrderRate || 0).toFixed(1)}%` },
      { label: "Profit Stability", value: data.advancedAnalytics.profitStability?.toFixed(2) || "N/A" },
    ];

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    
    const colWidth = (pageWidth - 2 * margin) / 2;
    advancedMetrics.forEach((metric, index) => {
      const col = index % 2;
      const x = margin + col * colWidth;
      const y = yPosition + Math.floor(index / 2) * 10;
      
      pdf.setFont(undefined, "bold");
      pdf.text(metric.label + ":", x, y);
      pdf.setFont(undefined, "normal");
      pdf.text(metric.value, x + 60, y);
    });

    yPosition += Math.ceil(advancedMetrics.length / 2) * 10 + 10;
  }

  // Advanced Insights AI Section
  if (data.sections.find(s => s.id === "advancedInsights")?.checked) {
    checkPageBreak(45);
    
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Advanced Metrics Insights", margin, yPosition);
    yPosition += 8;
    
    pdf.setFillColor(254, 215, 226);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40, "F");
    
    pdf.setFontSize(10);
    pdf.setTextColor(136, 19, 55);
    pdf.text("[AI-Generated Advanced Analytics]", margin + 5, yPosition + 7);
    pdf.setFontSize(9);
    pdf.setTextColor(159, 18, 57);
    pdf.text("Deep dive analysis covering:", margin + 5, yPosition + 15);
    pdf.text("• Efficiency patterns and labor productivity optimization", margin + 5, yPosition + 21);
    pdf.text("• Cost overrun root causes and mitigation strategies", margin + 5, yPosition + 27);
    pdf.text("• Profit stability assessment and variance explanations", margin + 5, yPosition + 33);
    
    yPosition += 50;
  }

  // Team Leaders Performance
  if (data.sections.find(s => s.id === "leaders")?.checked && data.leaderMetrics && data.leaderMetrics.length > 0) {
    checkPageBreak(20);
    
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Team Leader Performance", margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);
    
    // Table headers
    const headers = ["Leader", "Projects", "Revenue", "Gross Margin", "Efficiency"];
    const colWidths = [40, 20, 35, 30, 30];
    let xPos = margin;
    
    pdf.setFont(undefined, "bold");
    headers.forEach((header, i) => {
      pdf.text(header, xPos, yPosition);
      xPos += colWidths[i];
    });
    yPosition += 6;

    // Leader rows (top 10)
    pdf.setFont(undefined, "normal");
    data.leaderMetrics.slice(0, 10).forEach((leader: any) => {
      checkPageBreak(8);
      
      xPos = margin;
      const rowData = [
        leader.leaderName.substring(0, 18),
        leader.projectCount.toString(),
        formatCurrency(leader.totalRevenue),
        `${leader.grossMargin.toFixed(1)}%`,
        `${leader.efficiency.toFixed(1)}%`,
      ];
      
      rowData.forEach((data, i) => {
        pdf.text(data, xPos, yPosition);
        xPos += colWidths[i];
      });
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Leadership Analysis AI Section
  if (data.sections.find(s => s.id === "leaderInsights")?.checked) {
    checkPageBreak(45);
    
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Leadership Analysis", margin, yPosition);
    yPosition += 8;
    
    pdf.setFillColor(237, 233, 254);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40, "F");
    
    pdf.setFontSize(10);
    pdf.setTextColor(76, 29, 149);
    pdf.text("[AI-Generated Leadership Insights]", margin + 5, yPosition + 7);
    pdf.setFontSize(9);
    pdf.setTextColor(88, 28, 135);
    pdf.text("Team performance analysis including:", margin + 5, yPosition + 15);
    pdf.text("• Top performers and key success factors", margin + 5, yPosition + 21);
    pdf.text("• Leaders requiring support or additional training", margin + 5, yPosition + 27);
    pdf.text("• Resource allocation and workload optimization recommendations", margin + 5, yPosition + 33);
    
    yPosition += 50;
  }

  // Projects table
  if (data.sections.find(s => s.id === "projectsTable")?.checked) {
    checkPageBreak(20);
    
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Projects Summary", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);
    
    // Table headers
    const headers = ["Project", "Client", "Revenue", "Gross Profit", "Status"];
    const colWidths = [45, 40, 30, 30, 25];
    let xPos = margin;
    
    pdf.setFont(undefined, "bold");
    headers.forEach((header, i) => {
      pdf.text(header, xPos, yPosition);
      xPos += colWidths[i];
    });
    yPosition += 6;

    // Table rows (first 20 projects)
    pdf.setFont(undefined, "normal");
    data.projects.slice(0, 20).forEach((project) => {
      checkPageBreak(8);
      
      xPos = margin;
      const rowData = [
        project.title.substring(0, 20),
        project.clientName.name.substring(0, 18),
        formatCurrency(project.revenue.total),
        formatCurrency(project.profit.gross),
        project.endDate > new Date() ? "Active" : "Complete"
      ];
      
      rowData.forEach((data, i) => {
        pdf.text(data, xPos, yPosition);
        xPos += colWidths[i];
      });
      yPosition += 6;
    });

    if (data.projects.length > 20) {
      yPosition += 4;
      pdf.setTextColor(107, 114, 128);
      pdf.text(`...and ${data.projects.length - 20} more projects`, margin, yPosition);
    }
    yPosition += 10;
  }

  // Risk Analysis AI Section
  if (data.sections.find(s => s.id === "riskAnalysis")?.checked) {
    checkPageBreak(50);
    
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Risk Analysis", margin, yPosition);
    yPosition += 10;
    
    pdf.setFillColor(254, 226, 226);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 45, "F");
    
    pdf.setFontSize(10);
    pdf.setTextColor(153, 27, 27);
    pdf.text("[AI-Generated Risk Assessment]", margin + 5, yPosition + 7);
    pdf.setFontSize(9);
    pdf.setTextColor(185, 28, 28);
    pdf.text("Comprehensive risk evaluation covering:", margin + 5, yPosition + 15);
    pdf.text("• Financial risks: cash flow concerns, margin pressure, cost escalation", margin + 5, yPosition + 21);
    pdf.text("• Operational risks: resource constraints, schedule delays, quality issues", margin + 5, yPosition + 27);
    pdf.text("• Market risks: competitive pressures, client concentration, pricing challenges", margin + 5, yPosition + 33);
    pdf.text("• Mitigation strategies and contingency planning recommendations", margin + 5, yPosition + 39);
    
    yPosition += 55;
  }

  // Strategic Recommendations AI Section
  if (data.sections.find(s => s.id === "recommendations")?.checked) {
    checkPageBreak(55);
    
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Strategic Recommendations", margin, yPosition);
    yPosition += 10;
    
    pdf.setFillColor(209, 250, 229);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 50, "F");
    
    pdf.setFontSize(10);
    pdf.setTextColor(6, 78, 59);
    pdf.text("[AI-Generated Strategic Recommendations]", margin + 5, yPosition + 7);
    pdf.setFontSize(9);
    pdf.setTextColor(5, 150, 105);
    pdf.text("Actionable strategic guidance including:", margin + 5, yPosition + 15);
    pdf.text("• Short-term tactical improvements (30-90 days)", margin + 5, yPosition + 21);
    pdf.text("• Medium-term operational enhancements (3-6 months)", margin + 5, yPosition + 27);
    pdf.text("• Long-term strategic initiatives (6-12 months)", margin + 5, yPosition + 33);
    pdf.text("• Prioritized action items with expected ROI and implementation complexity", margin + 5, yPosition + 39);
    pdf.text("• Key performance indicators to track progress", margin + 5, yPosition + 45);
    
    yPosition += 55;
  }

  // Save the PDF
  const fileName = `${data.companyName.replace(/\s+/g, "_")}_CEO_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
}

function getFilterSummary(filters: any): string {
  const parts = [];
  if (filters.dateRange?.preset !== "all") {
    parts.push(`Period: ${filters.dateRange.preset}`);
  }
  if (filters.client) parts.push(`Client: ${filters.client}`);
  if (filters.leader) parts.push(`Leader: ${filters.leader}`);
  if (filters.businessType) parts.push(`Type: ${filters.businessType}`);
  if (filters.billingType) parts.push(`Billing: ${filters.billingType}`);
  return parts.length > 0 ? parts.join(" • ") : "All data included";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}