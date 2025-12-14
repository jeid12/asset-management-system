// app/dashboard/SettingsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaUser, FaPalette, FaSignOutAlt, FaTrash, FaEdit, FaMoon, FaSun, FaExclamationTriangle } from "react-icons/fa";
import apiClient from "@/app/utils/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  gender?: string;
  profilePicture?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdate: (user: User) => void;
}

export default function SettingsModal({ isOpen, onClose, user, onUserUpdate }: SettingsModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "account">("profile");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage and DOM
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const currentTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark";
    setTheme(currentTheme || savedTheme || "light");
  }, []);

  useEffect(() => {
    if (user) {
      setEditedUser({
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
      });
    }
  }, [user]);

  const handleThemeToggle = () => {
    if (!mounted) return;
    
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Apply theme
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
    
    localStorage.setItem("theme", newTheme);
    setSuccess("Theme updated successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiClient.put("/profile", editedUser);
      if (response.data.user) {
        onUserUpdate(response.data.user);
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call delete endpoint (you'll need to implement this in backend)
      await apiClient.delete("/profile");
      
      // Clear everything and redirect
      localStorage.clear();
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete account");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Call backend logout
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear local storage regardless of backend response
      localStorage.clear();
      router.push("/login");
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "appearance", label: "Appearance", icon: FaPalette },
    { id: "account", label: "Account", icon: FaSignOutAlt },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#1e3a8a",
            color: "white",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div style={{ display: "flex", height: "calc(90vh - 80px)" }}>
          {/* Sidebar Tabs */}
          <div
            style={{
              width: "200px",
              borderRight: "1px solid #e5e7eb",
              padding: "1rem 0",
              backgroundColor: "#f9fafb",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setError("");
                  setSuccess("");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.5rem",
                  backgroundColor: activeTab === tab.id ? "#dbeafe" : "transparent",
                  color: activeTab === tab.id ? "#1e3a8a" : "#6b7280",
                  border: "none",
                  borderLeft: activeTab === tab.id ? "3px solid #1e3a8a" : "3px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: activeTab === tab.id ? "600" : "500",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
            {/* Messages */}
            {error && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#d1fae5",
                  color: "#065f46",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                {success}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && user && (
              <div>
                <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.25rem", color: "#1f2937" }}>
                  Profile Information
                </h3>

                {!isEditing ? (
                  <div>
                    <div style={{ display: "grid", gap: "1rem" }}>
                      <InfoField label="Full Name" value={user.fullName} />
                      <InfoField label="Username" value={user.username} />
                      <InfoField label="Email" value={user.email} />
                      <InfoField label="Phone Number" value={user.phoneNumber} />
                      <InfoField label="Role" value={user.role} />
                      {user.gender && <InfoField label="Gender" value={user.gender} />}
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        marginTop: "1.5rem",
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#1e3a8a",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FaEdit /> Edit Profile
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "grid", gap: "1rem" }}>
                      <EditField
                        label="Full Name"
                        value={editedUser.fullName || ""}
                        onChange={(value) => setEditedUser({ ...editedUser, fullName: value })}
                      />
                      <EditField
                        label="Phone Number"
                        value={editedUser.phoneNumber || ""}
                        onChange={(value) => setEditedUser({ ...editedUser, phoneNumber: value })}
                      />
                      <EditField
                        label="Gender"
                        value={editedUser.gender || ""}
                        onChange={(value) => setEditedUser({ ...editedUser, gender: value })}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                        style={{
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: isLoading ? "not-allowed" : "pointer",
                          fontSize: "0.95rem",
                          fontWeight: "500",
                          opacity: isLoading ? 0.6 : 1,
                        }}
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedUser({
                            fullName: user.fullName,
                            phoneNumber: user.phoneNumber,
                            gender: user.gender,
                          });
                        }}
                        style={{
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "#e5e7eb",
                          color: "#374151",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "0.95rem",
                          fontWeight: "500",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div>
                <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.25rem", color: "#1f2937" }}>
                  Appearance Settings
                </h3>

                <div
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#1f2937" }}>Theme</h4>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                        Choose between light and dark mode
                      </p>
                    </div>
                    <button
                      onClick={handleThemeToggle}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: theme === "dark" ? "#1f2937" : "#f3f4f6",
                        color: theme === "dark" ? "white" : "#1f2937",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {theme === "light" ? <FaMoon /> : <FaSun />}
                      {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div>
                <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.25rem", color: "#1f2937" }}>
                  Account Actions
                </h3>

                {/* Logout Section */}
                <div
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#fef3c7",
                    borderRadius: "12px",
                    border: "1px solid #fbbf24",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#92400e" }}>Logout</h4>
                  <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "#78350f" }}>
                    Sign out from your account and clear your session
                  </p>
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#f59e0b",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      fontSize: "0.95rem",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <FaSignOutAlt />
                    {isLoading ? "Logging out..." : "Logout"}
                  </button>
                </div>

                {/* Delete Account Section */}
                <div
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#fee2e2",
                    borderRadius: "12px",
                    border: "1px solid #ef4444",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                    <FaExclamationTriangle color="#dc2626" size={20} />
                    <div>
                      <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#991b1b" }}>
                        Delete Account
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#7f1d1d" }}>
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FaTrash />
                      Delete Account
                    </button>
                  ) : (
                    <div>
                      <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", fontWeight: "600", color: "#991b1b" }}>
                        Type "DELETE" to confirm:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "0.95rem",
                          marginBottom: "0.75rem",
                        }}
                      />
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isLoading || deleteConfirmText !== "DELETE"}
                          style={{
                            padding: "0.75rem 1.5rem",
                            backgroundColor: deleteConfirmText === "DELETE" ? "#dc2626" : "#9ca3af",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: deleteConfirmText === "DELETE" && !isLoading ? "pointer" : "not-allowed",
                            fontSize: "0.95rem",
                            fontWeight: "500",
                          }}
                        >
                          {isLoading ? "Deleting..." : "Confirm Delete"}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText("");
                          }}
                          style={{
                            padding: "0.75rem 1.5rem",
                            backgroundColor: "#e5e7eb",
                            color: "#374151",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            fontWeight: "500",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#6b7280", marginBottom: "0.25rem" }}>
      {label}
    </label>
    <div
      style={{
        padding: "0.75rem",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        color: "#1f2937",
      }}
    >
      {value}
    </div>
  </div>
);

const EditField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div>
    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#6b7280", marginBottom: "0.25rem" }}>
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "0.75rem",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "0.95rem",
      }}
    />
  </div>
);
