"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import apiClient from "../../utils/api";
import {
  FaFileAlt,
  FaFileCsv,
  FaFilePdf,
  FaFilter,
  FaEye,
  FaDownload,
  FaChartBar,
  FaCalendar,
  FaSearch,
} from "react-icons/fa";

interface ReportType {
  type: string;
  name: string;
  description: string;
  availableFor: string[];
}

interface ReportColumn {
  key: string;
  label: string;
  type: string;
}

interface ReportData {
  data: any[];
  summary: any;
  metadata: any;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ReportsPage() {
  const [availableReports, setAvailableReports] = useState<ReportType[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [reportColumns, setReportColumns] = useState<ReportColumn[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [deviceStatus, setDeviceStatus] = useState("");
  const [applicationStatus, setApplicationStatus] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [actionType, setActionType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Preview mode
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchAvailableReports();
  }, []);

  useEffect(() => {
    if (selectedReportType) {
      fetchReportColumns();
    }
  }, [selectedReportType]);

  const fetchAvailableReports = async () => {
    try {
      const response = await apiClient.get("/reports/available");
      setAvailableReports(response.data.reports);
    } catch (err: any) {
      console.error("Failed to fetch available reports:", err);
      setError("Failed to load available reports");
    }
  };

  const fetchReportColumns = async () => {
    try {
      const response = await apiClient.get(`/reports/columns/${selectedReportType}`);
      setReportColumns(response.data.columns);
      // Select all columns by default
      setSelectedColumns(response.data.columns.map((col: ReportColumn) => col.key));
    } catch (err: any) {
      console.error("Failed to fetch report columns:", err);
    }
  };

  const generateReport = async () => {
    if (!selectedReportType) {
      setError("Please select a report type");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.append("reportType", selectedReportType);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (deviceType) params.append("deviceType", deviceType);
      if (deviceStatus) params.append("deviceStatus", deviceStatus);
      if (applicationStatus) params.append("applicationStatus", applicationStatus);
      if (schoolId) params.append("schoolId", schoolId);
      if (userRole) params.append("userRole", userRole);
      if (actionType) params.append("actionType", actionType);

      const response = await apiClient.get(`/reports/generate?${params.toString()}`);
      setReportData(response.data);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: "csv" | "pdf") => {
    if (!selectedReportType) {
      setError("Please select a report type");
      return;
    }

    try {
      setExporting(format);
      setError("");

      const params = new URLSearchParams();
      params.append("reportType", selectedReportType);

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (deviceType) params.append("deviceType", deviceType);
      if (deviceStatus) params.append("deviceStatus", deviceStatus);
      if (applicationStatus) params.append("applicationStatus", applicationStatus);
      if (schoolId) params.append("schoolId", schoolId);
      if (userRole) params.append("userRole", userRole);
      if (actionType) params.append("actionType", actionType);

      // Add selected columns
      if (selectedColumns.length > 0) {
        selectedColumns.forEach((col) => params.append("selectedColumns[]", col));
      }

      const response = await apiClient.get(`/reports/export/${format}?${params.toString()}`, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${selectedReportType}_report_${new Date().toISOString().split("T")[0]}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((col) => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(reportColumns.map((col) => col.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setDeviceType("");
    setDeviceStatus("");
    setApplicationStatus("");
    setSchoolId("");
    setUserRole("");
    setActionType("");
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>
            Reports & Analytics
          </h1>
          <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>
            Generate, preview, and export reports based on your access level
          </p>
        </div>

        {/* Report Type Selection */}
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>
            Select Report Type
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {availableReports.map((report) => (
              <div
                key={report.type}
                onClick={() => {
                  setSelectedReportType(report.type);
                  setReportData(null);
                  setShowPreview(false);
                  resetFilters();
                }}
                style={{
                  padding: "20px",
                  border: selectedReportType === report.type ? "2px solid #3B82F6" : "1px solid #E5E7EB",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: selectedReportType === report.type ? "#EFF6FF" : "white",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (selectedReportType !== report.type) {
                    e.currentTarget.style.borderColor = "#D1D5DB";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedReportType !== report.type) {
                    e.currentTarget.style.borderColor = "#E5E7EB";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                  <div
                    style={{
                      padding: "12px",
                      background: selectedReportType === report.type ? "#3B82F6" : "#F3F4F6",
                      borderRadius: "8px",
                    }}
                  >
                    <FaFileAlt size={20} color={selectedReportType === report.type ? "white" : "#6B7280"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", marginBottom: "4px" }}>
                      {report.name}
                    </h4>
                    <p style={{ fontSize: "0.875rem", color: "#6B7280", lineHeight: "1.5" }}>
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Section */}
        {selectedReportType && (
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <FaFilter size={16} color="#6B7280" />
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827", margin: 0 }}>
                Report Filters
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {/* Date Range */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FaCalendar size={12} />
                    Start Date
                  </span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FaCalendar size={12} />
                    End Date
                  </span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              {/* Device-specific filters */}
              {selectedReportType === "devices" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                      Device Type
                    </label>
                    <select
                      value={deviceType}
                      onChange={(e) => setDeviceType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                      }}
                    >
                      <option value="">All Types</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Projector">Projector</option>
                      <option value="Printer">Printer</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                      Status
                    </label>
                    <select
                      value={deviceStatus}
                      onChange={(e) => setDeviceStatus(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </>
              )}

              {/* Application-specific filters */}
              {selectedReportType === "applications" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                    Application Status
                  </label>
                  <select
                    value={applicationStatus}
                    onChange={(e) => setApplicationStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {/* User-specific filters */}
              {selectedReportType === "users" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                    User Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="rtb-staff">RTB Staff</option>
                    <option value="headteacher">Headteacher</option>
                    <option value="school">School</option>
                    <option value="school-staff">School Staff</option>
                  </select>
                </div>
              )}

              {/* Audit log filters */}
              {selectedReportType === "audit_logs" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="READ">Read</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
              <button
                onClick={generateReport}
                disabled={loading}
                style={{
                  background: loading ? "#9CA3AF" : "#3B82F6",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaEye size={14} />
                {loading ? "Generating..." : "Preview Report"}
              </button>

              <button
                onClick={resetFilters}
                style={{
                  background: "#6B7280",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Column Selection */}
        {selectedReportType && reportColumns.length > 0 && (
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827", margin: 0 }}>
                Select Columns for Export
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={selectAllColumns}
                  style={{
                    background: "#F3F4F6",
                    color: "#374151",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid #D1D5DB",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllColumns}
                  style={{
                    background: "#F3F4F6",
                    color: "#374151",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid #D1D5DB",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                  }}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {reportColumns.map((column) => (
                <label
                  key={column.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px",
                    background: selectedColumns.includes(column.key) ? "#EFF6FF" : "#F9FAFB",
                    border: selectedColumns.includes(column.key) ? "1px solid #3B82F6" : "1px solid #E5E7EB",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: selectedColumns.includes(column.key) ? "600" : "400", color: "#374151" }}>
                    {column.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Export Buttons */}
        {selectedReportType && (
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              marginBottom: "24px",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>
              Export Report
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => exportReport("csv")}
                disabled={exporting === "csv"}
                style={{
                  background: exporting === "csv" ? "#9CA3AF" : "#10B981",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: exporting === "csv" ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaFileCsv size={16} />
                {exporting === "csv" ? "Exporting..." : "Export as CSV"}
              </button>

              <button
                onClick={() => exportReport("pdf")}
                disabled={exporting === "pdf"}
                style={{
                  background: exporting === "pdf" ? "#9CA3AF" : "#EF4444",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: exporting === "pdf" ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaFilePdf size={16} />
                {exporting === "pdf" ? "Exporting..." : "Export as PDF"}
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "12px" }}>
              Note: PDF exports are limited to 100 records. For complete data, use CSV export.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#FEE2E2",
              color: "#991B1B",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "24px",
              border: "1px solid #FCA5A5",
            }}
          >
            {error}
          </div>
        )}

        {/* Report Preview */}
        {showPreview && reportData && (
          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E7EB", marginBottom: "24px" }}>
            {/* Summary Section */}
            <div style={{ padding: "24px", borderBottom: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <FaChartBar size={20} color="#3B82F6" />
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#111827", margin: 0 }}>
                  Report Summary
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                {Object.entries(reportData.summary).map(([key, value]) => {
                  if (typeof value === "object" && value !== null) {
                    return null; // Skip complex objects in summary cards
                  }
                  return (
                    <div
                      key={key}
                      style={{
                        padding: "16px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <p style={{ fontSize: "0.75rem", color: "#6B7280", marginBottom: "4px", textTransform: "uppercase" }}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", margin: 0 }}>
                        {typeof value === "number" ? value.toLocaleString() : String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Display complex summary data */}
              {Object.entries(reportData.summary).map(([key, value]) => {
                if (typeof value === "object" && value !== null) {
                  return (
                    <div key={key} style={{ marginTop: "20px" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                        {Object.entries(value).map(([subKey, subValue]) => (
                          <div
                            key={subKey}
                            style={{
                              padding: "12px",
                              background: "#EFF6FF",
                              borderRadius: "6px",
                              border: "1px solid #BFDBFE",
                            }}
                          >
                            <p style={{ fontSize: "0.75rem", color: "#1E40AF", marginBottom: "4px" }}>{subKey}</p>
                            <p style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1E3A8A", margin: 0 }}>
                              {String(subValue)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Data Table */}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827", margin: 0 }}>
                  Report Data Preview
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>
                  Showing {reportData.pagination.page} of {reportData.pagination.pages} pages ({reportData.pagination.total} total records)
                </p>
              </div>

              {reportData.data.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                  No data available for the selected filters
                </div>
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                      <thead>
                        <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
                          {Object.keys(reportData.data[0]).map((key) => (
                            <th
                              key={key}
                              style={{
                                padding: "12px 16px",
                                textAlign: "left",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: "#6B7280",
                                textTransform: "uppercase",
                              }}
                            >
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.data.map((row, index) => (
                          <tr key={index} style={{ borderBottom: "1px solid #F3F4F6" }}>
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td
                                key={cellIndex}
                                style={{
                                  padding: "12px 16px",
                                  color: "#374151",
                                  maxWidth: "300px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={String(value)}
                              >
                                {value === null || value === undefined
                                  ? "N/A"
                                  : typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {reportData.pagination.pages > 1 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "12px",
                        marginTop: "20px",
                      }}
                    >
                      <button
                        onClick={() => {
                          setPage((p) => Math.max(1, p - 1));
                          generateReport();
                        }}
                        disabled={page === 1}
                        style={{
                          background: page === 1 ? "#E5E7EB" : "#3B82F6",
                          color: page === 1 ? "#9CA3AF" : "white",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: page === 1 ? "not-allowed" : "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                        Page {page} of {reportData.pagination.pages}
                      </span>
                      <button
                        onClick={() => {
                          setPage((p) => Math.min(reportData.pagination.pages, p + 1));
                          generateReport();
                        }}
                        disabled={page === reportData.pagination.pages}
                        style={{
                          background: page === reportData.pagination.pages ? "#E5E7EB" : "#3B82F6",
                          color: page === reportData.pagination.pages ? "#9CA3AF" : "white",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: page === reportData.pagination.pages ? "not-allowed" : "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
