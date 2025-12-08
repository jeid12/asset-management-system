// src/controllers/report.controller.ts
import { Response } from "express";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import PDFDocument from "pdfkit";
import { createObjectCsvWriter } from "csv-writer";
import { ReportService } from "../services/report.service";
import { ReportFilterDto, ReportType } from "../dtos/report.dto";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as path from "path";
import * as fs from "fs";

const reportService = new ReportService();

/**
 * Generate and preview report data
 */
export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const filterDto = plainToClass(ReportFilterDto, req.query);
    const errors = await validate(filterDto);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
      });
    }

    const userId = req.user!.id;
    const userRole = (req.user as any).role;

    const reportData = await reportService.generateReport(filterDto, userId, userRole);

    // Apply pagination for preview
    const page = parseInt(filterDto.page || "1");
    const limit = parseInt(filterDto.limit || "50");
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedData = reportData.data.slice(startIndex, endIndex);

    return res.json({
      data: paginatedData,
      summary: reportData.summary,
      metadata: reportData.metadata,
      pagination: {
        page,
        limit,
        total: reportData.data.length,
        pages: Math.ceil(reportData.data.length / limit),
      },
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return res.status(500).json({
      message: error.message || "Failed to generate report",
    });
  }
};

/**
 * Export report as CSV
 */
export const exportReportCSV = async (req: AuthRequest, res: Response) => {
  try {
    const filterDto = plainToClass(ReportFilterDto, req.query);
    const errors = await validate(filterDto);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
      });
    }

    const userId = req.user!.id;
    const userRole = (req.user as any).role;

    const reportData = await reportService.generateReport(filterDto, userId, userRole);

    if (reportData.data.length === 0) {
      return res.status(404).json({
        message: "No data found for the specified filters",
      });
    }

    // Generate CSV
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${filterDto.reportType}_report_${timestamp}.csv`;
    const tempDir = path.join(__dirname, "../../temp");
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, fileName);

    // Get column headers from first data item
    const headers = Object.keys(reportData.data[0]).map((key) => ({
      id: key,
      title: key.replace(/([A-Z])/g, " $1").trim().toUpperCase(),
    }));

    // Filter columns if selectedColumns is provided
    const finalHeaders =
      filterDto.selectedColumns && filterDto.selectedColumns.length > 0
        ? headers.filter((h) => filterDto.selectedColumns!.includes(h.id))
        : headers;

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: finalHeaders,
    });

    // Filter data based on selected columns
    const csvData =
      filterDto.selectedColumns && filterDto.selectedColumns.length > 0
        ? reportData.data.map((row: any) => {
            const filteredRow: any = {};
            filterDto.selectedColumns!.forEach((col) => {
              filteredRow[col] = row[col];
            });
            return filteredRow;
          })
        : reportData.data;

    await csvWriter.writeRecords(csvData);

    // Send file
    return res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }
      // Clean up temp file after download
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
      });
    });
  } catch (error: any) {
    console.error("Error exporting CSV:", error);
    return res.status(500).json({
      message: error.message || "Failed to export CSV",
    });
  }
};

/**
 * Export report as PDF
 */
export const exportReportPDF = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const filterDto = plainToClass(ReportFilterDto, req.query);
    const errors = await validate(filterDto);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
      });
    }

    const userId = req.user!.id;
    const userRole = (req.user as any).role;

    const reportData = await reportService.generateReport(filterDto, userId, userRole);

    if (reportData.data.length === 0) {
      return res.status(404).json({
        message: "No data found for the specified filters",
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${filterDto.reportType}_report_${timestamp}.pdf`;

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Rwanda TVET Board", { align: "center" })
      .fontSize(16)
      .text("Asset Management System", { align: "center" })
      .moveDown();

    // Add report title
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(getReportTitle(filterDto.reportType), { align: "center" })
      .moveDown(0.5);

    // Add metadata
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" })
      .text(`Generated by: ${(req.user as any).fullName || "Unknown"}`, { align: "center" })
      .text(`Role: ${userRole}`, { align: "center" })
      .moveDown();

    // Add horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown();

    // Add summary section
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Summary Statistics", { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    Object.entries(reportData.summary).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        doc.font("Helvetica-Bold").text(`${formatKey(key)}:`, { continued: false });
        Object.entries(value).forEach(([subKey, subValue]) => {
          doc
            .font("Helvetica")
            .text(`  • ${formatKey(subKey)}: ${subValue}`, { indent: 20 });
        });
      } else {
        doc.text(`${formatKey(key)}: ${formatValue(value)}`);
      }
    });

    doc.moveDown();

    // Add horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown();

    // Add detailed data section
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Detailed Report Data", { underline: true })
      .moveDown(0.5);

    doc.fontSize(9).font("Helvetica");

    // Determine columns to display
    const columns = filterDto.selectedColumns || Object.keys(reportData.data[0]);
    const maxRecordsInPDF = 100; // Limit records in PDF for performance
    const dataToDisplay = reportData.data.slice(0, maxRecordsInPDF);

    // Simple table layout
    dataToDisplay.forEach((row: any, index: number) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(9).font("Helvetica");
      }

      doc.font("Helvetica-Bold").text(`Record ${index + 1}:`, { underline: true });
      doc.font("Helvetica");

      columns.forEach((col) => {
        if (row[col] !== undefined && row[col] !== null) {
          const displayValue = typeof row[col] === "object" 
            ? JSON.stringify(row[col]) 
            : String(row[col]);
          
          doc.text(`  ${formatKey(col)}: ${displayValue.substring(0, 100)}`, {
            width: 500,
          });
        }
      });

      doc.moveDown(0.5);
    });

    if (reportData.data.length > maxRecordsInPDF) {
      doc
        .fontSize(10)
        .font("Helvetica-Oblique")
        .text(
          `Note: Showing ${maxRecordsInPDF} of ${reportData.data.length} records. Export CSV for complete data.`,
          { align: "center" }
        );
    }

    // Finalize PDF (footer will be added via events)
    doc.end();
    return; // PDF is streamed to response
  } catch (error: any) {
    console.error("Error exporting PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        message: error.message || "Failed to export PDF",
      });
    }
  }
};

/**
 * Get available report types based on user role
 */
export const getAvailableReports = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = (req.user as any).role;

    const allReports = [
      {
        type: ReportType.DEVICES,
        name: "Device Report",
        description: "Overview of all devices, their status, and assignments",
        availableFor: ["admin", "rtb-staff", "school", "headteacher", "school-staff"],
      },
      {
        type: ReportType.APPLICATIONS,
        name: "Application Report",
        description: "Device application requests and their status",
        availableFor: ["admin", "rtb-staff", "school", "headteacher", "school-staff"],
      },
      {
        type: ReportType.USERS,
        name: "User Report",
        description: "User accounts and their roles",
        availableFor: ["admin", "rtb-staff"],
      },
      {
        type: ReportType.SCHOOLS,
        name: "School Report",
        description: "School information and statistics",
        availableFor: ["admin", "rtb-staff", "school", "headteacher", "school-staff"],
      },
      {
        type: ReportType.AUDIT_LOGS,
        name: "Audit Log Report",
        description: "System activity and user actions",
        availableFor: ["admin"],
      },
      {
        type: ReportType.NOTIFICATIONS,
        name: "Notification Report",
        description: "Notification history and statistics",
        availableFor: ["admin", "rtb-staff", "school", "headteacher", "school-staff"],
      },
    ];

    const availableReports = allReports.filter((report) =>
      report.availableFor.includes(userRole)
    );

    res.json({
      reports: availableReports,
      userRole,
    });
  } catch (error: any) {
    console.error("Error getting available reports:", error);
    res.status(500).json({
      message: "Failed to get available reports",
    });
  }
};

/**
 * Get available columns for a report type
 */
export const getReportColumns = async (req: AuthRequest, res: Response) => {
  try {
    const { reportType } = req.params;

    const columnsByType: Record<string, any[]> = {
      devices: [
        { key: "serialNumber", label: "Serial Number", type: "string" },
        { key: "category", label: "Category", type: "string" },
        { key: "brand", label: "Brand", type: "string" },
        { key: "model", label: "Model", type: "string" },
        { key: "status", label: "Status", type: "string" },
        { key: "condition", label: "Condition", type: "string" },
        { key: "assetTag", label: "Asset Tag", type: "string" },
        { key: "assignedToSchool", label: "Assigned School", type: "string" },
        { key: "schoolCode", label: "School Code", type: "string" },
        { key: "createdAt", label: "Created At", type: "date" },
      ],
      applications: [
        { key: "schoolName", label: "School Name", type: "string" },
        { key: "requestedLaptops", label: "Laptops", type: "number" },
        { key: "requestedDesktops", label: "Desktops", type: "number" },
        { key: "requestedTablets", label: "Tablets", type: "number" },
        { key: "requestedProjectors", label: "Projectors", type: "number" },
        { key: "requestedOthers", label: "Others", type: "number" },
        { key: "totalDevicesRequested", label: "Total Requested", type: "number" },
        { key: "purpose", label: "Purpose", type: "string" },
        { key: "justification", label: "Justification", type: "string" },
        { key: "status", label: "Status", type: "string" },
        { key: "assignedDevicesCount", label: "Assigned Devices", type: "number" },
        { key: "createdAt", label: "Created At", type: "date" },
        { key: "updatedAt", label: "Updated At", type: "date" },
      ],
      users: [
        { key: "fullName", label: "Full Name", type: "string" },
        { key: "username", label: "Username", type: "string" },
        { key: "email", label: "Email", type: "string" },
        { key: "phoneNumber", label: "Phone Number", type: "string" },
        { key: "role", label: "Role", type: "string" },
        { key: "gender", label: "Gender", type: "string" },
        { key: "createdAt", label: "Created At", type: "date" },
      ],
      schools: [
        { key: "schoolName", label: "School Name", type: "string" },
        { key: "schoolCode", label: "School Code", type: "string" },
        { key: "category", label: "Category", type: "string" },
        { key: "province", label: "Province", type: "string" },
        { key: "district", label: "District", type: "string" },
        { key: "sector", label: "Sector", type: "string" },
        { key: "email", label: "Email", type: "string" },
        { key: "phoneNumber", label: "Phone Number", type: "string" },
        { key: "status", label: "Status", type: "string" },
        { key: "createdAt", label: "Created At", type: "date" },
      ],
      audit_logs: [
        { key: "actorName", label: "Actor Name", type: "string" },
        { key: "actionType", label: "Action Type", type: "string" },
        { key: "targetEntity", label: "Target Entity", type: "string" },
        { key: "targetId", label: "Target ID", type: "string" },
        { key: "ipAddress", label: "IP Address", type: "string" },
        { key: "executionDuration", label: "Duration (ms)", type: "number" },
        { key: "createdAt", label: "Timestamp", type: "date" },
      ],
      notifications: [
        { key: "type", label: "Type", type: "string" },
        { key: "title", label: "Title", type: "string" },
        { key: "message", label: "Message", type: "string" },
        { key: "isRead", label: "Is Read", type: "boolean" },
        { key: "userName", label: "User Name", type: "string" },
        { key: "createdAt", label: "Created At", type: "date" },
      ],
    };

    const columns = columnsByType[reportType] || [];

    res.json({
      reportType,
      columns,
    });
  } catch (error: any) {
    console.error("Error getting report columns:", error);
    res.status(500).json({
      message: "Failed to get report columns",
    });
  }
};

// Helper functions
function getReportTitle(reportType: ReportType): string {
  const titles: Record<ReportType, string> = {
    [ReportType.DEVICES]: "Device Inventory Report",
    [ReportType.APPLICATIONS]: "Device Application Report",
    [ReportType.USERS]: "User Management Report",
    [ReportType.SCHOOLS]: "School Information Report",
    [ReportType.AUDIT_LOGS]: "System Audit Log Report",
    [ReportType.NOTIFICATIONS]: "Notification History Report",
  };
  return titles[reportType] || "System Report";
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
