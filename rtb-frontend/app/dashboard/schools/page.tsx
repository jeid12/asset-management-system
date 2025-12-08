"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import apiClient from "../../utils/api";

interface School {
  id: string;
  schoolCode: string;
  schoolName: string;
  category: "TSS" | "VTC" | "Other";
  province: string;
  district: string;
  sector: string;
  cell?: string;
  village?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  representativeId?: string;
  representative?: {
    id: string;
    fullName: string;
    email: string;
  };
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  total: number;
  byCategory: {
    TSS: number;
    VTC: number;
    Other: number;
  };
  byStatus: {
    Active: number;
    Inactive: number;
  };
  withRepresentative: number;
  withoutRepresentative: number;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [provinceFilter, setProvinceFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [newSchool, setNewSchool] = useState({
    schoolCode: "",
    schoolName: "",
    category: "TSS" as "TSS" | "VTC" | "Other",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    email: "",
    phoneNumber: "",
    address: "",
    representativeEmail: "",
    status: "Active" as "Active" | "Inactive",
  });

  const [bulkSchools, setBulkSchools] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    successful: any[];
    failed: any[];
  } | null>(null);

  const rwandaProvinces = ["Kigali", "Eastern", "Northern", "Southern", "Western"];

  // Download CSV template
  const downloadCSVTemplate = () => {
    const csvContent = `schoolCode,schoolName,category,province,district,sector,cell,village,email,phoneNumber,address,representativeEmail,status
TSS001,Kigali Technical School,TSS,Kigali,Gasabo,Remera,Rukiri,Kibagabaga,info@kts.rw,+250788123456,KG 123 St,representative1@example.com,Active
VTC002,Eastern VTC,VTC,Eastern,Rwamagana,Rubona,Nyamiyaga,Gahama,contact@evtc.rw,+250788654321,Rwamagana District,representative2@example.com,Active
TSS003,Northern Technical School,TSS,Northern,Gicumbi,Rukomo,,,northern@tss.rw,+250788111222,Northern Province,representative3@example.com,Inactive
`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'school_bulk_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV to JSON
  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const schools = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const school: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (value && value !== '') {
          school[header] = value;
        }
      });

      if (school.schoolCode && school.schoolName) {
        schools.push(school);
      }
    }

    return schools;
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await apiClient.get("/profile/me");
        const user = response.data.user;
        setCurrentUser(user);

        // Allow admin, rtb-staff, and school roles
        if (user.role !== "admin" && user.role !== "rtb-staff" && user.role !== "school") {
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Access check failed:", error);
        router.push("/login");
      }
    };
    checkAccess();
  }, [router]);

  const fetchSchools = useCallback(async () => {
    if (!currentUser) return;

    try {
      console.log("Fetching schools...");
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (provinceFilter) params.province = provinceFilter;

      const response = await apiClient.get("/schools", { params });
      console.log("Schools response:", response.data);

      setSchools(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Error fetching schools:", error);
      console.error("Error response:", error.response?.data);
      setSchools([]);
      setTotalPages(1);
    }
  }, [currentUser, currentPage, searchTerm, categoryFilter, statusFilter, provinceFilter]);

  const fetchStatistics = useCallback(async () => {
    if (!currentUser) return;
    
    // Only admin and rtb-staff can see full statistics
    if (currentUser.role !== "admin" && currentUser.role !== "rtb-staff") {
      return;
    }

    try {
      console.log("Fetching statistics...");
      const response = await apiClient.get("/schools/stats");
      console.log("Statistics response:", response.data);
      setStatistics(response.data.data || null);
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
      console.error("Error response:", error.response?.data);
      setStatistics(null);
    }
  }, [currentUser]);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    
    // Only admin and rtb-staff need to fetch users for representative assignment
    if (currentUser.role !== "admin" && currentUser.role !== "rtb-staff") {
      return;
    }

    try {
      console.log("Fetching users...");
      const response = await apiClient.get("/users", {
        params: { role: "school", limit: 1000 }
      });
      console.log("Users response:", response.data);
      setUsers(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      console.error("Error response:", error.response?.data);
      setUsers([]);
    }
  }, [currentUser]);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        try {
          await Promise.all([
            fetchSchools(),
            fetchStatistics(),
            fetchUsers()
          ]);
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [currentUser, fetchSchools, fetchStatistics, fetchUsers]);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/schools", {
        ...newSchool,
        cell: newSchool.cell || undefined,
        village: newSchool.village || undefined,
        email: newSchool.email || undefined,
        phoneNumber: newSchool.phoneNumber || undefined,
        address: newSchool.address || undefined,
      });

      if (response.data.success) {
        setShowAddModal(false);
        setNewSchool({
          schoolCode: "",
          schoolName: "",
          category: "TSS",
          province: "",
          district: "",
          sector: "",
          cell: "",
          village: "",
          email: "",
          phoneNumber: "",
          address: "",
          representativeEmail: "",
          status: "Active",
        });
        fetchSchools();
        fetchStatistics();
        alert("School created successfully!");
      }
    } catch (error: any) {
      alert(error.message || "Failed to create school");
    }
  };

  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    try {
      // Find representative email if representativeId exists
      const representativeEmail = selectedSchool.representativeId 
        ? users.find(u => u.id === selectedSchool.representativeId)?.email 
        : undefined;

      const response = await apiClient.patch(`/schools/${selectedSchool.id}`, {
        schoolCode: selectedSchool.schoolCode,
        schoolName: selectedSchool.schoolName,
        category: selectedSchool.category,
        province: selectedSchool.province,
        district: selectedSchool.district,
        sector: selectedSchool.sector,
        cell: selectedSchool.cell || undefined,
        village: selectedSchool.village || undefined,
        email: selectedSchool.email || undefined,
        phoneNumber: selectedSchool.phoneNumber || undefined,
        address: selectedSchool.address || undefined,
        representativeEmail: representativeEmail,
        status: selectedSchool.status,
      });

      if (response.data.success) {
        setShowEditModal(false);
        setSelectedSchool(null);
        fetchSchools();
        fetchStatistics();
        alert("School updated successfully!");
      }
    } catch (error: any) {
      alert(error.message || "Failed to update school");
    }
  };

  const handleDeleteSchool = async () => {
    if (!selectedSchool || deleteConfirmation !== "DELETE") return;

    try {
      const response = await apiClient.delete(`/schools/${selectedSchool.id}`);

      if (response.data.success) {
        setShowDeleteModal(false);
        setSelectedSchool(null);
        setDeleteConfirmation("");
        fetchSchools();
        fetchStatistics();
        alert("School deleted successfully!");
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete school");
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkLoading(true);
    setBulkResult(null);
    
    try {
      let schoolsArray;

      // Handle CSV file upload
      if (csvFile) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const csvText = event.target?.result as string;
            schoolsArray = parseCSV(csvText);

            if (schoolsArray.length === 0) {
              alert("No valid schools found in CSV file. Please check the format.");
              setBulkLoading(false);
              return;
            }

            const response = await apiClient.post("/schools/bulk", {
              schools: schoolsArray
            });

            if (response.data.success) {
              setBulkResult(response.data.data);
              fetchSchools();
              fetchStatistics();
              setCsvFile(null);
            }
          } catch (error: any) {
            alert(error.message || "Failed to process bulk import. Please check the format.");
          } finally {
            setBulkLoading(false);
          }
        };
        reader.readAsText(csvFile);
      } else {
        // Handle JSON input
        schoolsArray = JSON.parse(bulkSchools);
        
        const response = await apiClient.post("/schools/bulk", {
          schools: schoolsArray
        });

        if (response.data.success) {
          setBulkResult(response.data.data);
          fetchSchools();
          fetchStatistics();
        }
        setBulkLoading(false);
      }
    } catch (error: any) {
      alert(error.message || "Failed to process bulk import. Please check the format.");
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: "20px" }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "20px" }}>
        <h1 style={{ marginBottom: "20px", fontSize: "24px", fontWeight: "bold" }}>
          School Management
        </h1>

        {/* Statistics */}
        {statistics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
            <div style={{ background: "#f0f9ff", padding: "15px", borderRadius: "8px" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>Total Schools</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#0284c7" }}>
                {statistics.total || 0}
              </div>
            </div>
            <div style={{ background: "#fef3c7", padding: "15px", borderRadius: "8px" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>TSS</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>
                {statistics.byCategory?.TSS || 0}
              </div>
            </div>
            <div style={{ background: "#ddd6fe", padding: "15px", borderRadius: "8px" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>VTC</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>
                {statistics.byCategory?.VTC || 0}
              </div>
            </div>
            <div style={{ background: "#dcfce7", padding: "15px", borderRadius: "8px" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>Active</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a" }}>
                {statistics.byStatus?.Active || 0}
              </div>
            </div>
            <div style={{ background: "#fee2e2", padding: "15px", borderRadius: "8px" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>Inactive</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>
                {statistics.byStatus?.Inactive || 0}
              </div>
            </div>
            <div style={{ background: "#e0e7ff", padding: "15px", borderRadius: "8px" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>With Representative</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#4f46e5" }}>
                {statistics.withRepresentative || 0}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              flex: "1",
              minWidth: "200px",
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          >
            <option value="">All Categories</option>
            <option value="TSS">TSS</option>
            <option value="VTC">VTC</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          >
            <option value="">All Provinces</option>
            {rwandaProvinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
          {(currentUser?.role === "admin" || currentUser?.role === "rtb-staff") && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: "8px 16px",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                + Add School
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                style={{
                  padding: "8px 16px",
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Bulk Import
              </button>
            </>
          )}
        </div>

        {/* Schools Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Code</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Category</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Province</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>District</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Representative</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px" }}>{school.schoolCode}</td>
                  <td style={{ padding: "12px" }}>{school.schoolName}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        background:
                          school.category === "TSS"
                            ? "#fef3c7"
                            : school.category === "VTC"
                            ? "#ddd6fe"
                            : "#e5e7eb",
                        color:
                          school.category === "TSS"
                            ? "#d97706"
                            : school.category === "VTC"
                            ? "#7c3aed"
                            : "#6b7280",
                      }}
                    >
                      {school.category}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>{school.province}</td>
                  <td style={{ padding: "12px" }}>{school.district}</td>
                  <td style={{ padding: "12px" }}>
                    {school.representative ? school.representative.fullName : "—"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        background: school.status === "Active" ? "#dcfce7" : "#fee2e2",
                        color: school.status === "Active" ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {school.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    {(currentUser?.role === "admin" || currentUser?.role === "rtb-staff") && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedSchool(school);
                            setShowEditModal(true);
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "#0284c7",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            marginRight: "8px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSchool(school);
                            setShowDeleteModal(true);
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {currentUser?.role === "school" && (
                      <button
                        onClick={() => {
                          setSelectedSchool(school);
                          setShowEditModal(true);
                        }}
                        style={{
                          padding: "6px 12px",
                          background: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px",
              background: currentPage === 1 ? "#e5e7eb" : "#0284c7",
              color: currentPage === 1 ? "#9ca3af" : "white",
              border: "none",
              borderRadius: "6px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>
          <span style={{ padding: "8px 16px", display: "flex", alignItems: "center" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 16px",
              background: currentPage === totalPages ? "#e5e7eb" : "#0284c7",
              color: currentPage === totalPages ? "#9ca3af" : "white",
              border: "none",
              borderRadius: "6px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>

        {/* Add School Modal */}
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h2 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: "bold" }}>
                Add New School
              </h2>
              <form onSubmit={handleAddSchool}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      School Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchool.schoolCode}
                      onChange={(e) => setNewSchool({ ...newSchool, schoolCode: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      School Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchool.schoolName}
                      onChange={(e) => setNewSchool({ ...newSchool, schoolName: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Category *
                    </label>
                    <select
                      required
                      value={newSchool.category}
                      onChange={(e) => setNewSchool({ ...newSchool, category: e.target.value as any })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    >
                      <option value="TSS">TSS</option>
                      <option value="VTC">VTC</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Province *
                    </label>
                    <select
                      required
                      value={newSchool.province}
                      onChange={(e) => setNewSchool({ ...newSchool, province: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    >
                      <option value="">Select Province</option>
                      {rwandaProvinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchool.district}
                      onChange={(e) => setNewSchool({ ...newSchool, district: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Sector *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchool.sector}
                      onChange={(e) => setNewSchool({ ...newSchool, sector: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Cell
                    </label>
                    <input
                      type="text"
                      value={newSchool.cell}
                      onChange={(e) => setNewSchool({ ...newSchool, cell: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Village
                    </label>
                    <input
                      type="text"
                      value={newSchool.village}
                      onChange={(e) => setNewSchool({ ...newSchool, village: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={newSchool.email}
                      onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newSchool.phoneNumber}
                      onChange={(e) => setNewSchool({ ...newSchool, phoneNumber: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Address
                    </label>
                    <input
                      type="text"
                      value={newSchool.address}
                      onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Representative (School Role User)
                    </label>
                    <select
                      value={newSchool.representativeEmail}
                      onChange={(e) => setNewSchool({ ...newSchool, representativeEmail: e.target.value })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    >
                      <option value="">No Representative</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.email}>
                          {user.fullName}
                        </option>
                      ))}
                    </select>
                    <small style={{ display: "block", marginTop: "5px", color: "#6b7280" }}>
                      Only users with 'school' role can be assigned
                    </small>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Status *
                    </label>
                    <select
                      required
                      value={newSchool.status}
                      onChange={(e) => setNewSchool({ ...newSchool, status: e.target.value as any })}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewSchool({
                        schoolCode: "",
                        schoolName: "",
                        category: "TSS",
                        province: "",
                        district: "",
                        sector: "",
                        cell: "",
                        village: "",
                        email: "",
                        phoneNumber: "",
                        address: "",
                        representativeEmail: "",
                        status: "Active",
                      });
                    }}
                    style={{
                      padding: "10px 20px",
                      background: "#e5e7eb",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 20px",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Create School
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit School Modal */}
        {showEditModal && selectedSchool && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h2 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: "bold" }}>
                {currentUser?.role === "school" ? "School Details" : "Edit School"}
              </h2>
              <form onSubmit={handleEditSchool}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      School Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedSchool.schoolCode}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, schoolCode: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      School Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedSchool.schoolName}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, schoolName: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Category *
                    </label>
                    <select
                      required
                      value={selectedSchool.category}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, category: e.target.value as any })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    >
                      <option value="TSS">TSS</option>
                      <option value="VTC">VTC</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Province *
                    </label>
                    <select
                      required
                      value={selectedSchool.province}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, province: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    >
                      <option value="">Select Province</option>
                      {rwandaProvinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedSchool.district}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, district: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Sector *
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedSchool.sector}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, sector: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Cell
                    </label>
                    <input
                      type="text"
                      value={selectedSchool.cell || ""}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, cell: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Village
                    </label>
                    <input
                      type="text"
                      value={selectedSchool.village || ""}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, village: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={selectedSchool.email || ""}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, email: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={selectedSchool.phoneNumber || ""}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, phoneNumber: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Address
                    </label>
                    <input
                      type="text"
                      value={selectedSchool.address || ""}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, address: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Representative
                    </label>
                    <select
                      value={selectedSchool.representativeId || ""}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, representativeId: e.target.value })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    >
                      <option value="">No Representative</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
                      Status *
                    </label>
                    <select
                      required
                      value={selectedSchool.status}
                      onChange={(e) => setSelectedSchool({ ...selectedSchool, status: e.target.value as any })}
                      disabled={currentUser?.role === "school"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", background: currentUser?.role === "school" ? "#f3f4f6" : "white" }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSchool(null);
                    }}
                    style={{
                      padding: "10px 20px",
                      background: "#e5e7eb",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    {currentUser?.role === "school" ? "Close" : "Cancel"}
                  </button>
                  {(currentUser?.role === "admin" || currentUser?.role === "rtb-staff") && (
                    <button
                      type="submit"
                      style={{
                        padding: "10px 20px",
                        background: "#0284c7",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Update School
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedSchool && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "500px",
              }}
            >
              <h2 style={{ marginBottom: "15px", fontSize: "20px", fontWeight: "bold", color: "#dc2626" }}>
                Delete School
              </h2>
              <p style={{ marginBottom: "15px", color: "#6b7280" }}>
                Are you sure you want to delete <strong>{selectedSchool.schoolName}</strong>? This action cannot
                be undone.
              </p>
              <p style={{ marginBottom: "15px", fontSize: "14px", color: "#6b7280" }}>
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  marginBottom: "20px",
                }}
              />
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSchool(null);
                    setDeleteConfirmation("");
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "#e5e7eb",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSchool}
                  disabled={deleteConfirmation !== "DELETE"}
                  style={{
                    padding: "10px 20px",
                    background: deleteConfirmation === "DELETE" ? "#dc2626" : "#fca5a5",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: deleteConfirmation === "DELETE" ? "pointer" : "not-allowed",
                  }}
                >
                  Delete School
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "700px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h2 style={{ marginBottom: "15px", fontSize: "20px", fontWeight: "bold" }}>
                Bulk Import Schools
              </h2>
              
              {/* CSV Upload Section */}
              <div style={{ marginBottom: "20px", padding: "15px", background: "#f0f9ff", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px", color: "#0284c7" }}>
                  Option 1: Upload CSV File (Recommended)
                </h3>
                <button
                  type="button"
                  onClick={downloadCSVTemplate}
                  style={{
                    padding: "8px 16px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  📥 Download CSV Template
                </button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    marginTop: "10px",
                  }}
                />
                {csvFile && (
                  <p style={{ marginTop: "8px", fontSize: "14px", color: "#059669" }}>
                    ✅ Selected: {csvFile.name}
                  </p>
                )}
              </div>

              {/* JSON Input Section */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px", color: "#6b7280" }}>
                  Option 2: Paste JSON (Advanced)
                </h3>
                <p style={{ marginBottom: "10px", fontSize: "14px", color: "#6b7280" }}>
                  Enter a JSON array of schools. Example:
                </p>
                <pre
                  style={{
                    background: "#f9fafb",
                    padding: "15px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    marginBottom: "15px",
                    overflow: "auto",
                  }}
                >
{`[
  {
    "schoolCode": "TSS001",
    "schoolName": "Kigali Technical School",
    "category": "TSS",
    "province": "Kigali",
    "district": "Gasabo",
    "sector": "Remera",
    "cell": "Rukiri",
    "village": "Kibagabaga",
    "email": "info@kts.rw",
    "phoneNumber": "+250788123456",
    "address": "KG 123 St",
    "representativeEmail": "representative1@example.com",
    "status": "Active"
  },
  {
    "schoolCode": "VTC002",
    "schoolName": "Eastern VTC",
    "category": "VTC",
    "province": "Eastern",
    "district": "Rwamagana",
    "sector": "Rubona",
    "email": "info@easternvtc.rw",
    "representativeEmail": "representative2@example.com",
    "status": "Active"
  }
]`}
                </pre>
                <textarea
                  value={bulkSchools}
                  onChange={(e) => setBulkSchools(e.target.value)}
                  placeholder="Paste JSON array here..."
                  rows={12}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    marginBottom: "15px",
                  }}
                />
              </div>

              <form onSubmit={handleBulkCreate}>
                {bulkResult && (
                  <div
                    style={{
                      padding: "15px",
                      borderRadius: "6px",
                      marginBottom: "15px",
                      background: bulkResult.failed.length > 0 ? "#fef3c7" : "#dcfce7",
                    }}
                  >
                    <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Import Results:</p>
                    <p>✅ Successful: {bulkResult.successful.length}</p>
                    <p>❌ Failed: {bulkResult.failed.length}</p>
                    {bulkResult.failed.length > 0 && (
                      <div style={{ marginTop: "10px" }}>
                        <p style={{ fontWeight: "bold" }}>Failed Schools:</p>
                        <ul style={{ marginLeft: "20px", fontSize: "14px" }}>
                          {bulkResult.failed.map((error, idx) => (
                            <li key={idx}>
                              {error.schoolCode}: {error.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkSchools("");
                      setBulkResult(null);
                      setCsvFile(null);
                    }}
                    style={{
                      padding: "10px 20px",
                      background: "#e5e7eb",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={bulkLoading || (!csvFile && !bulkSchools.trim())}
                    style={{
                      padding: "10px 20px",
                      background: (bulkLoading || (!csvFile && !bulkSchools.trim())) ? "#d1d5db" : "#0284c7",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: (bulkLoading || (!csvFile && !bulkSchools.trim())) ? "not-allowed" : "pointer",
                    }}
                  >
                    {bulkLoading ? "Importing..." : csvFile ? "Import from CSV" : "Import from JSON"}
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
