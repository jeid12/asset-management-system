"use client";

/**
 * School User Applications Page
 * - School users can: Create applications, View their own applications, Confirm receipt of assigned devices
 * - School users CANNOT: Review applications, Update eligibility, Assign devices (Admin/Staff only)
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import apiClient from "../../utils/api";
import {
  FaFileUpload,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaBoxOpen,
  FaEye,
  FaDownload,
} from "react-icons/fa";

interface Application {
  id: string;
  school: {
    name: string;
    code: string;
  };
  requestedDevices: {
    laptops: number;
    desktops: number;
    tablets: number;
    projectors: number;
    others: number;
  };
  purpose: string;
  justification?: string;
  status: string;
  isEligible: boolean;
  eligibilityNotes?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  assignedDevices?: any[];
  assignedBy?: string;
  assignedAt?: string;
  confirmedAt?: string;
  createdAt: string;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    purpose: "",
    justification: "",
    requestedLaptops: 0,
    requestedDesktops: 0,
    requestedTablets: 0,
    requestedProjectors: 0,
    requestedOthers: 0,
  });
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const response = await apiClient.get("/profile/me");
      const role = response.data.user.role;
      setUserRole(role);
      
      // Redirect admin/staff to correct page
      if (role === "admin" || role === "rtb-staff") {
        router.push("/dashboard/admin/applications");
        return;
      }
      
      // Only school users can access this page
      if (role === "school") {
        fetchApplications();
      } else {
        setError("Access denied. This page is only for school users.");
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
      const response = await apiClient.get("/applications/my");
      setApplications(response.data.applications || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!letterFile) {
      setError("Please upload an application letter (PDF)");
      return;
    }

    const totalRequested = 
      formData.requestedLaptops + 
      formData.requestedDesktops + 
      formData.requestedTablets + 
      formData.requestedProjectors + 
      formData.requestedOthers;

    if (totalRequested === 0) {
      setError("Please request at least one device");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const submitData = new FormData();
      submitData.append("purpose", formData.purpose);
      submitData.append("justification", formData.justification);
      submitData.append("requestedLaptops", formData.requestedLaptops.toString());
      submitData.append("requestedDesktops", formData.requestedDesktops.toString());
      submitData.append("requestedTablets", formData.requestedTablets.toString());
      submitData.append("requestedProjectors", formData.requestedProjectors.toString());
      submitData.append("requestedOthers", formData.requestedOthers.toString());
      submitData.append("letter", letterFile);

      await apiClient.post("/applications", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setShowCreateModal(false);
      setFormData({
        purpose: "",
        justification: "",
        requestedLaptops: 0,
        requestedDesktops: 0,
        requestedTablets: 0,
        requestedProjectors: 0,
        requestedOthers: 0,
      });
      setLetterFile(null);
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReceipt = async (applicationId: string) => {
    if (!confirm("Confirm that you have received all assigned devices?")) {
      return;
    }

    try {
      await apiClient.post(`/applications/${applicationId}/confirm`, {
        confirmationNotes: "Devices received successfully",
      });
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to confirm receipt");
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Device Applications</h1>
            <p style={{ color: "#6B7280" }}>Submit and track your device requests</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              backgroundColor: "#2563EB",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
            }}
          >
            <FaFileUpload />
            New Application
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: "#FEE2E2", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
            <p style={{ color: "#991B1B" }}>{error}</p>
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "12px",
              textAlign: "center",
              border: "1px solid #E5E7EB",
            }}
          >
            <FaFileUpload size={48} style={{ color: "#9CA3AF", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>No Applications Yet</h3>
            <p style={{ color: "#6B7280", marginBottom: "16px" }}>
              Start by submitting your first device application
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                backgroundColor: "#2563EB",
                color: "white",
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Create Application
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {applications.map((app) => (
              <div
                key={app.id}
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                      {app.school.name}
                    </h3>
                    <p style={{ color: "#6B7280", fontSize: "14px" }}>
                      Submitted on {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                {/* Requested Devices */}
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "#374151" }}>
                    Requested Devices:
                  </h4>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {app.requestedDevices.laptops > 0 && (
                      <span style={{ backgroundColor: "#F3F4F6", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}>
                        {app.requestedDevices.laptops} Laptop{app.requestedDevices.laptops > 1 ? "s" : ""}
                      </span>
                    )}
                    {app.requestedDevices.desktops > 0 && (
                      <span style={{ backgroundColor: "#F3F4F6", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}>
                        {app.requestedDevices.desktops} Desktop{app.requestedDevices.desktops > 1 ? "s" : ""}
                      </span>
                    )}
                    {app.requestedDevices.tablets > 0 && (
                      <span style={{ backgroundColor: "#F3F4F6", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}>
                        {app.requestedDevices.tablets} Tablet{app.requestedDevices.tablets > 1 ? "s" : ""}
                      </span>
                    )}
                    {app.requestedDevices.projectors > 0 && (
                      <span style={{ backgroundColor: "#F3F4F6", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}>
                        {app.requestedDevices.projectors} Projector{app.requestedDevices.projectors > 1 ? "s" : ""}
                      </span>
                    )}
                    {app.requestedDevices.others > 0 && (
                      <span style={{ backgroundColor: "#F3F4F6", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}>
                        {app.requestedDevices.others} Other{app.requestedDevices.others > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Purpose */}
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                    Purpose:
                  </h4>
                  <p style={{ color: "#6B7280", fontSize: "14px" }}>{app.purpose}</p>
                </div>

                {/* Review Info */}
                {app.reviewNotes && (
                  <div
                    style={{
                      backgroundColor: "#F9FAFB",
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                      Review Notes:
                    </h4>
                    <p style={{ color: "#6B7280", fontSize: "14px" }}>{app.reviewNotes}</p>
                    {app.reviewedBy && (
                      <p style={{ color: "#9CA3AF", fontSize: "12px", marginTop: "4px" }}>
                        Reviewed by {app.reviewedBy}
                      </p>
                    )}
                  </div>
                )}

                {/* Eligibility */}
                {app.status !== "Pending" && (
                  <div style={{ marginBottom: "16px" }}>
                    <span
                      style={{
                        backgroundColor: app.isEligible ? "#D1FAE5" : "#FEE2E2",
                        color: app.isEligible ? "#065F46" : "#991B1B",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {app.isEligible ? "Eligible" : "Not Eligible"}
                    </span>
                    {app.eligibilityNotes && (
                      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "8px" }}>
                        {app.eligibilityNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* Assigned Devices */}
                {app.assignedDevices && app.assignedDevices.length > 0 && (
                  <div
                    style={{
                      backgroundColor: "#EEF2FF",
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "#374151" }}>
                      Assigned Devices ({app.assignedDevices.length}):
                    </h4>
                    <div style={{ display: "grid", gap: "4px" }}>
                      {app.assignedDevices.map((device: any, idx: number) => (
                        <p key={idx} style={{ color: "#4B5563", fontSize: "14px" }}>
                          • {device.category}: {device.serialNumber}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => downloadLetter(app.id)}
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
                      fontSize: "14px",
                      fontWeight: "600",
                      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563EB";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#3B82F6";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(59, 130, 246, 0.3)";
                    }}
                  >
                    <FaDownload size={16} />
                    Download Application Letter (PDF)
                  </button>

                  {app.status === "Assigned" && (
                    <button
                      onClick={() => handleConfirmReceipt(app.id)}
                      style={{
                        backgroundColor: "#10B981",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      <FaCheckCircle size={14} />
                      Confirm Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Application Modal */}
        {showCreateModal && (
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
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>
                New Device Application
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Purpose */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Purpose <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    required
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="Explain the purpose of this request..."
                  />
                </div>

                {/* Justification */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Justification
                  </label>
                  <textarea
                    value={formData.justification}
                    onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="Provide additional justification..."
                  />
                </div>

                {/* Requested Devices */}
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                    Requested Devices <span style={{ color: "#EF4444" }}>*</span>
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Laptops</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.requestedLaptops}
                        onChange={(e) =>
                          setFormData({ ...formData, requestedLaptops: parseInt(e.target.value) || 0 })
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Desktops</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.requestedDesktops}
                        onChange={(e) =>
                          setFormData({ ...formData, requestedDesktops: parseInt(e.target.value) || 0 })
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Tablets</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.requestedTablets}
                        onChange={(e) =>
                          setFormData({ ...formData, requestedTablets: parseInt(e.target.value) || 0 })
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Projectors</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.requestedProjectors}
                        onChange={(e) =>
                          setFormData({ ...formData, requestedProjectors: parseInt(e.target.value) || 0 })
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Others</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.requestedOthers}
                        onChange={(e) =>
                          setFormData({ ...formData, requestedOthers: parseInt(e.target.value) || 0 })
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Letter Upload */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Application Letter (PDF) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "8px" }}>
                    Upload a letter addressed to the General Director of RTB (PDF only, max 10MB)
                  </p>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setLetterFile(((e.target.files && e.target.files[0]) || null))}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      backgroundColor: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: submitting ? "#9CA3AF" : "#2563EB",
                      color: "white",
                      cursor: submitting ? "not-allowed" : "pointer",
                      fontWeight: "600",
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
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
