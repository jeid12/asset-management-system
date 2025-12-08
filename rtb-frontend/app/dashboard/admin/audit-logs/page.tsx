"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";
import apiClient from "../../../utils/api";
import { FaFilter, FaDownload, FaEye, FaSearch, FaClock, FaUser, FaNetworkWired } from "react-icons/fa";

interface AuditLog {
  id: string;
  actorId: string;
  actorName?: string;
  actorEmail?: string;
  actionType: string;
  targetEntity: string;
  targetId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  executionDuration?: number;
  statusCode?: number;
  errorMessage?: string;
  metadata?: any;
  createdAt: string;
}

interface Stats {
  totalLogs: number;
  totalActors: number;
  avgExecutionTime: number;
  actionTypeDistribution: Record<string, number>;
  recentActivity: number;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionTypeFilter, setActionTypeFilter] = useState("");
  const [targetEntityFilter, setTargetEntityFilter] = useState("");
  const [actorIdFilter, setActorIdFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (userRole === "admin") {
      fetchAuditLogs();
      fetchStats();
    }
  }, [page, actionTypeFilter, targetEntityFilter, actorIdFilter, startDateFilter, endDateFilter]);

  const checkUserRole = async () => {
    try {
      const response = await apiClient.get("/profile/me");
      const role = response.data.user.role;
      setUserRole(role);
      
      if (role !== "admin") {
        router.push("/dashboard");
        return;
      }
    } catch (err: any) {
      setError("Failed to verify user permissions");
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      
      if (actionTypeFilter) params.append("actionType", actionTypeFilter);
      if (targetEntityFilter) params.append("targetEntity", targetEntityFilter);
      if (actorIdFilter) params.append("actorId", actorIdFilter);
      if (startDateFilter) params.append("startDate", startDateFilter);
      if (endDateFilter) params.append("endDate", endDateFilter);

      const response = await apiClient.get(`/audit-logs?${params.toString()}`);
      setLogs(response.data.data || []);
      setTotal(response.data.pagination.total || 0);
      setTotalPages(response.data.pagination.pages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/audit-logs/stats");
      setStats(response.data);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionTypeFilter) params.append("actionType", actionTypeFilter);
      if (targetEntityFilter) params.append("targetEntity", targetEntityFilter);
      if (actorIdFilter) params.append("actorId", actorIdFilter);
      if (startDateFilter) params.append("startDate", startDateFilter);
      if (endDateFilter) params.append("endDate", endDateFilter);

      const response = await apiClient.get(`/audit-logs/export?${params.toString()}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert("Failed to export audit logs");
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      CREATE: { bg: "#D1FAE5", text: "#065F46" },
      READ: { bg: "#DBEAFE", text: "#1E40AF" },
      UPDATE: { bg: "#FEF3C7", text: "#92400E" },
      DELETE: { bg: "#FEE2E2", text: "#991B1B" },
      LOGIN: { bg: "#E0E7FF", text: "#3730A3" },
      LOGOUT: { bg: "#F3F4F6", text: "#374151" },
      EXPORT: { bg: "#FCE7F3", text: "#9F1239" },
    };
    return colors[actionType] || { bg: "#F3F4F6", text: "#374151" };
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.actorName?.toLowerCase().includes(search) ||
      log.actorEmail?.toLowerCase().includes(search) ||
      log.actionType.toLowerCase().includes(search) ||
      log.targetEntity.toLowerCase().includes(search) ||
      log.ipAddress?.toLowerCase().includes(search)
    );
  });

  if (userRole !== "admin") {
    return null;
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header with Stats */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>
            Audit Logs
          </h1>
          <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>
            Track and monitor all system activities and user actions
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "8px" }}>Total Logs</p>
                  <p style={{ fontSize: "1.875rem", fontWeight: "700", color: "#111827" }}>{(stats.totalLogs || 0).toLocaleString()}</p>
                </div>
                <div style={{ padding: "12px", background: "#DBEAFE", borderRadius: "8px" }}>
                  <FaClock size={24} color="#1E40AF" />
                </div>
              </div>
            </div>

            <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "8px" }}>Active Users</p>
                  <p style={{ fontSize: "1.875rem", fontWeight: "700", color: "#111827" }}>{stats.totalActors || 0}</p>
                </div>
                <div style={{ padding: "12px", background: "#D1FAE5", borderRadius: "8px" }}>
                  <FaUser size={24} color="#065F46" />
                </div>
              </div>
            </div>

            <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "8px" }}>Avg Response Time</p>
                  <p style={{ fontSize: "1.875rem", fontWeight: "700", color: "#111827" }}>
                    {formatDuration(stats.avgExecutionTime || 0)}
                  </p>
                </div>
                <div style={{ padding: "12px", background: "#FEF3C7", borderRadius: "8px" }}>
                  <FaNetworkWired size={24} color="#92400E" />
                </div>
              </div>
            </div>

            <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "8px" }}>Recent Activity (24h)</p>
                  <p style={{ fontSize: "1.875rem", fontWeight: "700", color: "#111827" }}>{stats.recentActivity || 0}</p>
                </div>
                <div style={{ padding: "12px", background: "#FCE7F3", borderRadius: "8px" }}>
                  <FaClock size={24} color="#9F1239" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <FaFilter size={16} color="#6B7280" />
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", margin: 0 }}>Filters</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                Action Type
              </label>
              <select
                value={actionTypeFilter}
                onChange={(e) => {
                  setActionTypeFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  color: "#374151",
                }}
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="READ">Read</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="EXPORT">Export</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                Target Entity
              </label>
              <select
                value={targetEntityFilter}
                onChange={(e) => {
                  setTargetEntityFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  color: "#374151",
                }}
              >
                <option value="">All Entities</option>
                <option value="User">User</option>
                <option value="School">School</option>
                <option value="Device">Device</option>
                <option value="DeviceApplication">Device Application</option>
                <option value="Notification">Notification</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  color: "#374151",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                End Date
              </label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  color: "#374151",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
              <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <FaSearch size={16} color="#9CA3AF" />
              </div>
              <input
                type="text"
                placeholder="Search by actor, email, IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 40px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  color: "#374151",
                }}
              />
            </div>

            <button
              onClick={handleExport}
              style={{
                background: "#10B981",
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FaDownload size={14} />
              Export CSV
            </button>

            <button
              onClick={() => {
                setActionTypeFilter("");
                setTargetEntityFilter("");
                setActorIdFilter("");
                setStartDateFilter("");
                setEndDateFilter("");
                setSearchTerm("");
                setPage(1);
              }}
              style={{
                background: "#6B7280",
                color: "white",
                padding: "8px 16px",
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

        {/* Audit Logs Table */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
              Loading audit logs...
            </div>
          ) : error ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#EF4444" }}>
              {error}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
              No audit logs found
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", textTransform: "uppercase" }}>
                        Timestamp
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", textTransform: "uppercase" }}>
                        Action
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", textTransform: "uppercase" }}>
                        Actor
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", textTransform: "uppercase" }}>
                        Target
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", textTransform: "uppercase" }}>
                        IP Address
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", textTransform: "uppercase" }}>
                        Duration
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", textTransform: "uppercase" }}>
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const badgeColor = getActionBadgeColor(log.actionType);
                      return (
                        <tr key={log.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#374151" }}>
                            <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                            <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                background: badgeColor.bg,
                                color: badgeColor.text,
                                padding: "4px 12px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                              }}
                            >
                              {log.actionType}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#374151" }}>
                            <div style={{ fontWeight: "500" }}>{log.actorName || "Unknown"}</div>
                            <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{log.actorEmail}</div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#374151" }}>
                            <div style={{ fontWeight: "500" }}>{log.targetEntity}</div>
                            {log.targetId && (
                              <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                                ID: {log.targetId.substring(0, 8)}...
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#374151", fontFamily: "monospace" }}>
                            {log.ipAddress || "N/A"}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#374151" }}>
                            {formatDuration(log.executionDuration)}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <button
                              onClick={() => setSelectedLog(log)}
                              style={{
                                background: "#3B82F6",
                                color: "white",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <FaEye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", padding: "16px", borderTop: "1px solid #E5E7EB" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    Page {page} of {totalPages} ({total} total)
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      background: page === totalPages ? "#E5E7EB" : "#3B82F6",
                      color: page === totalPages ? "#9CA3AF" : "white",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
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

        {/* Detail Modal */}
        {selectedLog && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => setSelectedLog(null)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "800px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: "24px", borderBottom: "1px solid #E5E7EB" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", margin: 0 }}>
                  Audit Log Details
                </h2>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px" }}>
                <div style={{ display: "grid", gap: "20px" }}>
                  {/* Basic Info */}
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
                      Basic Information
                    </h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                          TIMESTAMP
                        </label>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151" }}>
                          {new Date(selectedLog.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                          ACTION TYPE
                        </label>
                        <span
                          style={{
                            ...getActionBadgeColor(selectedLog.actionType),
                            background: getActionBadgeColor(selectedLog.actionType).bg,
                            color: getActionBadgeColor(selectedLog.actionType).text,
                            padding: "4px 12px",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                          }}
                        >
                          {selectedLog.actionType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actor Info */}
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
                      Actor Information
                    </h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                          NAME
                        </label>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151" }}>
                          {selectedLog.actorName || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                          EMAIL
                        </label>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151" }}>
                          {selectedLog.actorEmail || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                          ACTOR ID
                        </label>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151", fontFamily: "monospace" }}>
                          {selectedLog.actorId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Target Info */}
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
                      Target Information
                    </h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                          ENTITY
                        </label>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151" }}>
                          {selectedLog.targetEntity}
                        </p>
                      </div>
                      {selectedLog.targetId && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                            TARGET ID
                          </label>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151", fontFamily: "monospace" }}>
                            {selectedLog.targetId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
                      Technical Details
                    </h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                          IP ADDRESS
                        </label>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151", fontFamily: "monospace" }}>
                          {selectedLog.ipAddress || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                          EXECUTION DURATION
                        </label>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151" }}>
                          {formatDuration(selectedLog.executionDuration)}
                        </p>
                      </div>
                      {selectedLog.statusCode && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                            STATUS CODE
                          </label>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151" }}>
                            {selectedLog.statusCode}
                          </p>
                        </div>
                      )}
                      {selectedLog.userAgent && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
                            USER AGENT
                          </label>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "#374151", wordBreak: "break-all" }}>
                            {selectedLog.userAgent}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Changes */}
                  {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
                        Changes
                      </h3>
                      <div
                        style={{
                          background: "#F9FAFB",
                          padding: "16px",
                          borderRadius: "8px",
                          overflow: "auto",
                        }}
                      >
                        <pre style={{ margin: 0, fontSize: "0.875rem", color: "#374151", fontFamily: "monospace" }}>
                          {JSON.stringify(selectedLog.changes, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
                        Metadata
                      </h3>
                      <div
                        style={{
                          background: "#F9FAFB",
                          padding: "16px",
                          borderRadius: "8px",
                          overflow: "auto",
                        }}
                      >
                        <pre style={{ margin: 0, fontSize: "0.875rem", color: "#374151", fontFamily: "monospace" }}>
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {selectedLog.errorMessage && (
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#EF4444", marginBottom: "12px" }}>
                        Error Message
                      </h3>
                      <div
                        style={{
                          background: "#FEE2E2",
                          padding: "16px",
                          borderRadius: "8px",
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#991B1B" }}>
                          {selectedLog.errorMessage}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: "24px", borderTop: "1px solid #E5E7EB", textAlign: "right" }}>
                <button
                  onClick={() => setSelectedLog(null)}
                  style={{
                    background: "#3B82F6",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
