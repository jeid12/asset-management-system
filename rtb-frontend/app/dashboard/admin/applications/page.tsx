"use client";

/**
 * Admin/Staff Applications Management Page
 * - Admin/Staff can: View all applications, Review applications, Update eligibility, Assign devices
 * - Admin/Staff CANNOT: Confirm receipt (School users only)
 * - Route protected by backend: requireRole(["admin", "rtb-staff"])
 */

import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import apiClient from "../../../utils/api";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaBoxOpen,
  FaEye,
  FaDownload,
  FaSearch,
  FaFilter,
} from "react-icons/fa";

interface Application {
  id: string;
  school: {
    name: string;
    code: string;
    district: string;
  };
  applicant: {
    name: string;
    email: string;
  };
  requestedDevices: {
    laptops: number;
    desktops: number;
    tablets: number;
    projectors: number;
    others: number;
  };
  purpose: string;
  status: string;
  isEligible: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  assignedBy?: string;
  assignedAt?: string;
  createdAt: string;
}

interface ApplicationDetails extends Application {
  justification?: string;
  letterPath: string;
  eligibilityNotes?: string;
  reviewNotes?: string;
  assignedDevices?: any[];
  confirmedAt?: string;
  confirmationNotes?: string;
}

interface Device {
  id: string;
  serialNumber: string;
  category: string;
  brand: string;
  model: string;
  status: string;
}

export default function ManageApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: "",
    reviewNotes: "",
    eligibilityNotes: "",
  });

  // Eligibility modal
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityData, setEligibilityData] = useState({
    isEligible: "true",
    eligibilityNotes: "",
  });

  // Assign devices modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [deviceCategory, setDeviceCategory] = useState("");
  const [deviceSearchTerm, setDeviceSearchTerm] = useState("");

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const response = await apiClient.get("/profile/me");
      const role = response.data.user.role;
      setUserRole(role);
      
      // Only admin/staff can access this page
      if (role === "admin" || role === "rtb-staff") {
        fetchApplications();
      } else {
        setError("Access denied. This page is only for administrators and staff.");
        setLoading(false);
      }
    } catch (err: any) {
      setError("Failed to verify user permissions");
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      
      const response = await apiClient.get(`/applications?${params.toString()}`);
      setApplications(response.data.applications || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetails = async (id: string) => {
    try {
      const response = await apiClient.get(`/applications/${id}`);
      setSelectedApplication(response.data.application);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch application details");
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    try {
      await apiClient.put(`/applications/${selectedApplication.id}/review`, reviewData);
      setShowReviewModal(false);
      setReviewData({ status: "", reviewNotes: "", eligibilityNotes: "" });
      fetchApplications();
      fetchApplicationDetails(selectedApplication.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to review application");
    }
  };

  const handleUpdateEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    try {
      await apiClient.put(`/applications/${selectedApplication.id}/eligibility`, eligibilityData);
      setShowEligibilityModal(false);
      fetchApplications();
      fetchApplicationDetails(selectedApplication.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update eligibility");
    }
  };

  const fetchAvailableDevices = async () => {
    try {
      const params = new URLSearchParams();
      params.append("status", "Available");
      if (deviceCategory) params.append("category", deviceCategory);
      
      const response = await apiClient.get(`/devices?${params.toString()}`);
      setAvailableDevices(response.data.devices || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch devices");
    }
  };

  const handleAssignDevices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    try {
      await apiClient.post(`/applications/${selectedApplication.id}/assign`, {
        deviceIds: selectedDevices,
      });
      setShowAssignModal(false);
      setSelectedDevices([]);
      fetchApplications();
      fetchApplicationDetails(selectedApplication.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign devices");
    }
  };

  const downloadLetter = async (applicationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/letter`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to download letter");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `application-letter-${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to download application letter");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Pending: { bg: "#FEF3C7", color: "#92400E", icon: FaClock },
      "Under Review": { bg: "#DBEAFE", color: "#1E40AF", icon: FaClock },
      Approved: { bg: "#D1FAE5", color: "#065F46", icon: FaCheckCircle },
      Rejected: { bg: "#FEE2E2", color: "#991B1B", icon: FaTimesCircle },
      Assigned: { bg: "#E0E7FF", color: "#3730A3", icon: FaBoxOpen },
      Received: { bg: "#D1FAE5", color: "#065F46", icon: FaCheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <span
        style={{
          backgroundColor: config.bg,
          color: config.color,
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const filteredApplications = applications.filter((app) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    
    // Search in school name, code, district, and applicant name/email
    return (
      app.school.name.toLowerCase().includes(search) ||
      app.school.code.toLowerCase().includes(search) ||
      app.school.district.toLowerCase().includes(search) ||
      app.applicant.name.toLowerCase().includes(search) ||
      app.applicant.email.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading applications...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            Manage Applications
          </h1>
          <p style={{ color: "#6B7280" }}>Review and process device applications</p>
        </div>

        {error && (
          <div style={{ backgroundColor: "#FEE2E2", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
            <p style={{ color: "#991B1B" }}>{error}</p>
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid #E5E7EB",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "250px" }}>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center"
              }}>
                <FaSearch />
              </div>
              <input
                type="text"
                placeholder="Search by school name, code, district, or applicant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 40px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setTimeout(fetchApplications, 0);
            }}
            style={{
              padding: "10px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              minWidth: "150px",
            }}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Assigned">Assigned</option>
            <option value="Received">Received</option>
          </select>
        </div>

        {/* Applications Table */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#F9FAFB" }}>
              <tr>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                  }}
                >
                  School
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                  }}
                >
                  Applicant
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                  }}
                >
                  Requested
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const totalRequested =
                    app.requestedDevices.laptops +
                    app.requestedDevices.desktops +
                    app.requestedDevices.tablets +
                    app.requestedDevices.projectors +
                    app.requestedDevices.others;

                  return (
                    <tr key={app.id} style={{ borderTop: "1px solid #E5E7EB" }}>
                      <td style={{ padding: "16px" }}>
                        <div>
                          <p style={{ fontWeight: "600", marginBottom: "4px" }}>{app.school.name}</p>
                          <p style={{ fontSize: "12px", color: "#6B7280" }}>{app.school.code}</p>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div>
                          <p style={{ fontSize: "14px", marginBottom: "2px" }}>{app.applicant.name}</p>
                          <p style={{ fontSize: "12px", color: "#6B7280" }}>{app.applicant.email}</p>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <p style={{ fontSize: "14px", fontWeight: "600" }}>{totalRequested} devices</p>
                      </td>
                      <td style={{ padding: "16px" }}>{getStatusBadge(app.status)}</td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#6B7280" }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <button
                          onClick={() => {
                            fetchApplicationDetails(app.id);
                          }}
                          style={{
                            backgroundColor: "#2563EB",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "14px",
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Application Details Modal */}
        {selectedApplication && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => setSelectedApplication(null)}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "700px",
                maxHeight: "90vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>
                    Application Details
                  </h2>
                  <p style={{ color: "#6B7280", fontSize: "14px" }}>
                    {selectedApplication.school.name} - {selectedApplication.school.code}
                  </p>
                </div>
                {getStatusBadge(selectedApplication.status)}
              </div>

              {/* School & Applicant Info */}
              <div
                style={{
                  backgroundColor: "#F9FAFB",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>District</p>
                    <p style={{ fontSize: "14px", fontWeight: "600" }}>{selectedApplication.school.district}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>Applicant</p>
                    <p style={{ fontSize: "14px", fontWeight: "600" }}>{selectedApplication.applicant.name}</p>
                  </div>
                </div>
              </div>

              {/* Requested Devices */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                  Requested Devices
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
                  {selectedApplication.requestedDevices.laptops > 0 && (
                    <div style={{ backgroundColor: "#F3F4F6", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <p style={{ fontSize: "24px", fontWeight: "bold", color: "#2563EB" }}>
                        {selectedApplication.requestedDevices.laptops}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6B7280" }}>Laptops</p>
                    </div>
                  )}
                  {selectedApplication.requestedDevices.desktops > 0 && (
                    <div style={{ backgroundColor: "#F3F4F6", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <p style={{ fontSize: "24px", fontWeight: "bold", color: "#2563EB" }}>
                        {selectedApplication.requestedDevices.desktops}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6B7280" }}>Desktops</p>
                    </div>
                  )}
                  {selectedApplication.requestedDevices.tablets > 0 && (
                    <div style={{ backgroundColor: "#F3F4F6", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <p style={{ fontSize: "24px", fontWeight: "bold", color: "#2563EB" }}>
                        {selectedApplication.requestedDevices.tablets}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6B7280" }}>Tablets</p>
                    </div>
                  )}
                  {selectedApplication.requestedDevices.projectors > 0 && (
                    <div style={{ backgroundColor: "#F3F4F6", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <p style={{ fontSize: "24px", fontWeight: "bold", color: "#2563EB" }}>
                        {selectedApplication.requestedDevices.projectors}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6B7280" }}>Projectors</p>
                    </div>
                  )}
                  {selectedApplication.requestedDevices.others > 0 && (
                    <div style={{ backgroundColor: "#F3F4F6", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <p style={{ fontSize: "24px", fontWeight: "bold", color: "#2563EB" }}>
                        {selectedApplication.requestedDevices.others}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6B7280" }}>Others</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Purpose & Justification */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>Purpose</h3>
                <p style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6" }}>
                  {selectedApplication.purpose}
                </p>
              </div>

              {selectedApplication.justification && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>Justification</h3>
                  <p style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6" }}>
                    {selectedApplication.justification}
                  </p>
                </div>
              )}

              {/* Review Notes */}
              {selectedApplication.reviewNotes && (
                <div
                  style={{
                    backgroundColor: "#EFF6FF",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>Review Notes</h4>
                  <p style={{ fontSize: "14px", color: "#374151" }}>{selectedApplication.reviewNotes}</p>
                </div>
              )}

              {/* Eligibility */}
              {selectedApplication.status !== "Pending" && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span
                      style={{
                        backgroundColor: selectedApplication.isEligible ? "#D1FAE5" : "#FEE2E2",
                        color: selectedApplication.isEligible ? "#065F46" : "#991B1B",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {selectedApplication.isEligible ? "Eligible" : "Not Eligible"}
                    </span>
                    {selectedApplication.status === "Approved" && (
                      <button
                        onClick={() => {
                          setEligibilityData({
                            isEligible: selectedApplication.isEligible ? "true" : "false",
                            eligibilityNotes: selectedApplication.eligibilityNotes || "",
                          });
                          setShowEligibilityModal(true);
                        }}
                        style={{
                          backgroundColor: "#F3F4F6",
                          color: "#374151",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Update
                      </button>
                    )}
                  </div>
                  {selectedApplication.eligibilityNotes && (
                    <p style={{ fontSize: "14px", color: "#6B7280" }}>
                      {selectedApplication.eligibilityNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Assigned Devices */}
              {selectedApplication.assignedDevices && selectedApplication.assignedDevices.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#EEF2FF",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                    Assigned Devices ({selectedApplication.assignedDevices.length})
                  </h3>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {selectedApplication.assignedDevices.map((device: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: "white",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>{device.category}</span>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#6B7280" }}>
                          {device.serialNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  onClick={() => downloadLetter(selectedApplication.id)}
                  style={{
                    backgroundColor: "#3B82F6",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: "600",
                    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <FaDownload />
                  Download Application Letter (PDF)
                </button>

                {selectedApplication.status === "Pending" || selectedApplication.status === "Under Review" ? (
                  <button
                    onClick={() => {
                      setReviewData({
                        status: selectedApplication.status === "Pending" ? "Under Review" : "Approved",
                        reviewNotes: "",
                        eligibilityNotes: "",
                      });
                      setShowReviewModal(true);
                    }}
                    style={{
                      backgroundColor: "#2563EB",
                      color: "white",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Review Application
                  </button>
                ) : selectedApplication.status === "Approved" &&
                  selectedApplication.isEligible &&
                  !selectedApplication.assignedDevices ? (
                  <button
                    onClick={() => {
                      setShowAssignModal(true);
                      fetchAvailableDevices();
                    }}
                    style={{
                      backgroundColor: "#10B981",
                      color: "white",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FaBoxOpen />
                    Assign Devices
                  </button>
                ) : null}

                <button
                  onClick={() => setSelectedApplication(null)}
                  style={{
                    backgroundColor: "#F3F4F6",
                    color: "#374151",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedApplication && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1001,
            }}
            onClick={() => setShowReviewModal(false)}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "500px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>
                Review Application
              </h2>

              <form onSubmit={handleReview}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Decision <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    value={reviewData.status}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">Select decision</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Review Notes
                  </label>
                  <textarea
                    value={reviewData.reviewNotes}
                    onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="Add review notes..."
                  />
                </div>

                {reviewData.status === "Approved" && (
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                      Eligibility Notes
                    </label>
                    <textarea
                      value={reviewData.eligibilityNotes}
                      onChange={(e) => setReviewData({ ...reviewData, eligibilityNotes: e.target.value })}
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                      placeholder="Notes about eligibility..."
                    />
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#2563EB",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Eligibility Modal */}
        {showEligibilityModal && selectedApplication && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1001,
            }}
            onClick={() => setShowEligibilityModal(false)}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "400px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>
                Update Eligibility
              </h2>

              <form onSubmit={handleUpdateEligibility}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Eligibility Status
                  </label>
                  <select
                    value={eligibilityData.isEligible}
                    onChange={(e) => setEligibilityData({ ...eligibilityData, isEligible: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="true">Eligible</option>
                    <option value="false">Not Eligible</option>
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Notes
                  </label>
                  <textarea
                    value={eligibilityData.eligibilityNotes}
                    onChange={(e) =>
                      setEligibilityData({ ...eligibilityData, eligibilityNotes: e.target.value })
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="Eligibility notes..."
                  />
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowEligibilityModal(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#2563EB",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Devices Modal */}
        {showAssignModal && selectedApplication && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1001,
            }}
            onClick={() => setShowAssignModal(false)}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "600px",
                maxHeight: "80vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>
                Assign Devices
              </h2>

              <form onSubmit={handleAssignDevices}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Filter by Category
                  </label>
                  <select
                    value={deviceCategory}
                    onChange={(e) => {
                      setDeviceCategory(e.target.value);
                      setTimeout(fetchAvailableDevices, 0);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">All Categories</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Projector">Projector</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Search Devices
                  </label>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      <FaSearch />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by serial number, brand, or model..."
                      value={deviceSearchTerm}
                      onChange={(e) => setDeviceSearchTerm(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 10px 10px 40px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "12px" }}>
                    Selected: {selectedDevices.length} device(s)
                  </p>
                  <div
                    style={{
                      maxHeight: "300px",
                      overflow: "auto",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  >
                    {availableDevices.filter((device) => {
                      const search = deviceSearchTerm.toLowerCase().trim();
                      if (!search) return true;
                      return (
                        device.serialNumber.toLowerCase().includes(search) ||
                        device.brand.toLowerCase().includes(search) ||
                        device.model.toLowerCase().includes(search) ||
                        device.category.toLowerCase().includes(search)
                      );
                    }).length === 0 ? (
                      <p style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
                        No devices found
                      </p>
                    ) : (
                      availableDevices.filter((device) => {
                        const search = deviceSearchTerm.toLowerCase().trim();
                        if (!search) return true;
                        return (
                          device.serialNumber.toLowerCase().includes(search) ||
                          device.brand.toLowerCase().includes(search) ||
                          device.model.toLowerCase().includes(search) ||
                          device.category.toLowerCase().includes(search)
                        );
                      }).map((device) => (
                        <label
                          key={device.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "12px",
                            borderBottom: "1px solid #E5E7EB",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDevices.includes(device.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDevices([...selectedDevices, device.id]);
                              } else {
                                setSelectedDevices(selectedDevices.filter((id) => id !== device.id));
                              }
                            }}
                            style={{ marginRight: "12px" }}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: "600", marginBottom: "2px" }}>
                              {device.serialNumber}
                            </p>
                            <p style={{ fontSize: "12px", color: "#6B7280" }}>
                              {device.category} - {device.brand} {device.model}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedDevices([]);
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedDevices.length === 0}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: selectedDevices.length === 0 ? "#9CA3AF" : "#10B981",
                      color: "white",
                      cursor: selectedDevices.length === 0 ? "not-allowed" : "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Assign {selectedDevices.length} Device(s)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
