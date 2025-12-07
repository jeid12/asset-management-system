"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/app/utils/api";
import DashboardLayout from "@/app/components/DashboardLayout";
import { FaEdit, FaTrash, FaSearch, FaFilter, FaUserCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: "school" | "admin" | "technician" | "rtb-staff";
  gender?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [stats, setStats] = useState<any>(null);

  // Check if user is admin or staff
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await apiClient.get("/profile/me");
        const user = response.data.user;
        setCurrentUser(user);

        if (user.role !== "admin" && user.role !== "rtb-staff") {
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Access check failed:", error);
        router.push("/dashboard");
      }
    };
    checkAccess();
  }, [router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    if (currentUser.role !== "admin" && currentUser.role !== "rtb-staff") return;
    
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;

      const response = await apiClient.get("/users", { params });
      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      if (error.response?.status === 403) {
        alert("Access denied. You don't have permission to view users.");
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, pagination.page, pagination.limit, searchTerm, roleFilter, router]);

  const fetchStats = useCallback(async () => {
    if (!currentUser) return;
    if (currentUser.role !== "admin" && currentUser.role !== "rtb-staff") return;
    
    try {
      const response = await apiClient.get("/users/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, [currentUser]);

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteConfirmation("");
    setShowDeleteModal(true);
  };

  const confirmRoleUpdate = async () => {
    if (!selectedUser) return;

    try {
      await apiClient.patch(`/users/${selectedUser.id}/role`, { role: newRole });
      alert("User role updated successfully!");
      setShowEditModal(false);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update role");
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser || deleteConfirmation !== "DELETE") return;

    try {
      await apiClient.delete(`/users/${selectedUser.id}`);
      alert("User deleted successfully!");
      setShowDeleteModal(false);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "#dc2626";
      case "rtb-staff":
        return "#2563eb";
      case "technician":
        return "#16a34a";
      case "school":
        return "#ca8a04";
      default:
        return "#6b7280";
    }
  };

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "rtb-staff")) {
    return null;
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
            User Management
          </h1>
          <p style={{ color: "#6b7280" }}>Manage system users, roles, and permissions</p>
        </div>

      {/* Statistics Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Users</p>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>{stats.total}</p>
          </div>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Admins</p>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#dc2626" }}>{stats.byRole.admin}</p>
          </div>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>RTB Staff</p>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2563eb" }}>{stats.byRole["rtb-staff"]}</p>
          </div>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Technicians</p>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#16a34a" }}>{stats.byRole.technician}</p>
          </div>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Schools</p>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#ca8a04" }}>{stats.byRole.school}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: "500" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <FaSearch />
                Search Users
              </span>
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, username, or email..."
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "0.875rem",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: "500" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <FaFilter />
                Filter by Role
              </span>
            </label>
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "0.875rem",
                minWidth: "200px",
              }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="rtb-staff">RTB Staff</option>
              <option value="technician">Technician</option>
              <option value="school">School</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>No users found</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "1rem", textAlign: "left", color: "#374151", fontSize: "0.875rem", fontWeight: "600" }}>User</th>
                    <th style={{ padding: "1rem", textAlign: "left", color: "#374151", fontSize: "0.875rem", fontWeight: "600" }}>Contact</th>
                    <th style={{ padding: "1rem", textAlign: "left", color: "#374151", fontSize: "0.875rem", fontWeight: "600" }}>Role</th>
                    <th style={{ padding: "1rem", textAlign: "left", color: "#374151", fontSize: "0.875rem", fontWeight: "600" }}>Joined</th>
                    <th style={{ padding: "1rem", textAlign: "center", color: "#374151", fontSize: "0.875rem", fontWeight: "600" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {user.profilePicture ? (
                            <img
                              src={`http://localhost:5000/uploads/profiles/${user.profilePicture}`}
                              alt={user.fullName}
                              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <FaUserCircle size={40} color="#9ca3af" />
                          )}
                          <div>
                            <p style={{ fontWeight: "500", color: "#1f2937", margin: 0 }}>{user.fullName}</p>
                            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <p style={{ fontSize: "0.875rem", color: "#1f2937", margin: "0 0 0.25rem 0" }}>{user.email}</p>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{user.phoneNumber}</p>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            backgroundColor: getRoleBadgeColor(user.role) + "20",
                            color: getRoleBadgeColor(user.role),
                          }}
                        >
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button
                            onClick={() => handleEditRole(user)}
                            disabled={user.id === currentUser?.id}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: user.id === currentUser?.id ? "#e5e7eb" : "#3b82f6",
                              color: user.id === currentUser?.id ? "#9ca3af" : "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: user.id === currentUser?.id ? "not-allowed" : "pointer",
                              fontSize: "0.875rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <FaEdit /> Edit Role
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUser?.id}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: user.id === currentUser?.id ? "#e5e7eb" : "#ef4444",
                              color: user.id === currentUser?.id ? "#9ca3af" : "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: user.id === currentUser?.id ? "not-allowed" : "pointer",
                              fontSize: "0.875rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: pagination.page === 1 ? "#e5e7eb" : "#3b82f6",
                    color: pagination.page === 1 ? "#9ca3af" : "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FaChevronLeft /> Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: pagination.page >= pagination.totalPages ? "#e5e7eb" : "#3b82f6",
                    color: pagination.page >= pagination.totalPages ? "#9ca3af" : "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  Next <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>
              Update User Role
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              Change the role for <strong>{selectedUser.fullName}</strong>
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: "500" }}>
                Select New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                }}
              >
                <option value="school">School</option>
                <option value="admin">Admin</option>
                <option value="technician">Technician</option>
                <option value="rtb-staff">RTB Staff</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleUpdate}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#dc2626" }}>
              Delete User Account
            </h2>
            <div style={{ backgroundColor: "#fef2f2", padding: "1rem", borderRadius: "6px", marginBottom: "1rem" }}>
              <p style={{ color: "#991b1b", fontSize: "0.875rem", margin: 0 }}>
                ⚠️ <strong>Warning:</strong> This action cannot be undone. This will permanently delete the user account and remove all associated data.
              </p>
            </div>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              You are about to delete <strong>{selectedUser.fullName}</strong> (@{selectedUser.username})
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem", fontWeight: "500" }}>
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirmation !== "DELETE"}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: deleteConfirmation !== "DELETE" ? "#fca5a5" : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: deleteConfirmation !== "DELETE" ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
