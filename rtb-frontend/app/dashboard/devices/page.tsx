"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import apiClient from "../../utils/api";
import { FaEdit, FaTrash, FaPlus, FaUpload, FaDownload, FaTasks } from "react-icons/fa";

// Add spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  if (!document.querySelector('style[data-spinner]')) {
    style.setAttribute('data-spinner', 'true');
    document.head.appendChild(style);
  }
}

interface Device {
  id: string;
  serialNumber: string;
  category: string;
  brand: string;
  model: string;
  schoolCode?: string;
  status: string;
  specifications?: string;
  condition: string;
  assetTag?: string;
  school?: {
    schoolName: string;
    schoolCode: string;
  };
}

interface Stats {
  total: number;
  byStatus: {
    Available: number;
    Assigned: number;
    Maintenance: number;
    "Written Off": number;
  };
  byCategory: {
    Laptop: number;
    Desktop: number;
    Tablet: number;
    Projector: number;
    Others: number;
  };
  byCondition: {
    New: number;
    Good: number;
    Fair: number;
    Faulty: number;
  };
}

interface School {
  id: string;
  schoolCode: string;
  schoolName: string;
}

export default function DevicesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Form states
  const [newDevice, setNewDevice] = useState({
    serialNumber: "",
    category: "Laptop",
    brand: "",
    model: "",
    schoolCode: "",
    status: "Available",
    specifications: "",
    condition: "New"
  });

  const [bulkDevices, setBulkDevices] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<{ successful: any[]; failed: any[] } | null>(null);

  const [assignData, setAssignData] = useState({
    serialNumbers: [] as string[],
    schoolCode: ""
  });
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const downloadCSVTemplate = () => {
    const headers = "serialNumber,category,brand,model,schoolCode,status,specifications,condition";
    const example1 = "LPT-883492,Laptop,HP,ProBook 450,,Available,8GB RAM/256GB SSD,New,";
    const example2 = "TAB-00293,Tablet,Samsung,Galaxy Tab A,,Available,4GB RAM/64GB Storage,Good,";
    const example3 = "DSK-12345,Desktop,Dell,OptiPlex 7090,TSS0001,Assigned,16GB RAM/512GB SSD,New,ASSET-0001";
    
    const csv = `${headers}\n${example1}\n${example2}\n${example3}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devices_template.csv";
    a.click();
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Parse CSV properly handling quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]);
    const devices: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const device: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        // Keep empty strings for optional fields, they'll be handled by backend
        if (value !== undefined) {
          device[header] = value;
        }
      });

      // Only require essential fields
      if (device.serialNumber && device.category && device.brand && device.model && device.status && device.condition) {
        devices.push(device);
      }
    }

    return devices;
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await apiClient.get("/profile/me");
        const user = response.data.user;
        setCurrentUser(user);

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

  const fetchDevices = useCallback(async () => {
    if (!currentUser) return;

    try {
      console.log("Fetching devices...");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(schoolFilter && { schoolCode: schoolFilter })
      });

      const response = await apiClient.get(`/devices?${params}`);
      console.log("Devices response:", response.data);

      if (response.data.success) {
        setDevices(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, page, search, categoryFilter, statusFilter, schoolFilter]);

  const fetchStats = useCallback(async () => {
    if (!currentUser) return;

    try {
      const response = await apiClient.get("/devices/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, [currentUser]);

  const fetchSchools = useCallback(async () => {
    if (!currentUser) return;
    if (currentUser.role !== "admin" && currentUser.role !== "rtb-staff") return;

    try {
      const response = await apiClient.get("/schools?limit=1000");
      if (response.data.success) {
        setSchools(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchDevices();
      fetchStats();
      fetchSchools();
    }
  }, [currentUser, fetchDevices, fetchStats, fetchSchools]);

  const handleAddDevice = async () => {
    try {
      // Prepare device data and remove empty schoolCode
      const deviceData = { ...newDevice };
      if (!deviceData.schoolCode || deviceData.schoolCode === "") {
        delete deviceData.schoolCode;
      }
      if (!deviceData.specifications || deviceData.specifications === "") {
        delete deviceData.specifications;
      }
      // Asset tag will be auto-generated on backend if school is assigned

      const response = await apiClient.post("/devices", deviceData);
      if (response.data.success) {
        alert("Device added successfully!");
        setShowAddModal(false);
        setNewDevice({
          serialNumber: "",
          category: "Laptop",
          brand: "",
          model: "",
          schoolCode: "",
          status: "Available",
          specifications: "",
          condition: "New"
        });
        fetchDevices();
        fetchStats();
      }
    } catch (error: any) {
      console.error("Add device error:", error);
      alert(error.response?.data?.message || "Failed to add device");
    }
  };

  const handleEditDevice = async () => {
    if (!selectedDevice) return;

    try {
      // Prepare device data and remove empty fields
      const deviceData = { ...newDevice };
      if (!deviceData.schoolCode || deviceData.schoolCode === "") {
        deviceData.schoolCode = undefined as any;
      }
      if (!deviceData.specifications || deviceData.specifications === "") {
        delete deviceData.specifications;
      }
      // Asset tag will be auto-generated on backend if school is assigned

      const response = await apiClient.put(`/devices/${selectedDevice.id}`, deviceData);
      if (response.data.success) {
        alert("Device updated successfully!");
        setShowEditModal(false);
        setSelectedDevice(null);
        fetchDevices();
        fetchStats();
      }
    } catch (error: any) {
      console.error("Edit device error:", error);
      alert(error.response?.data?.message || "Failed to update device");
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this device?")) return;

    try {
      const response = await apiClient.delete(`/devices/${id}`);
      if (response.data.success) {
        alert("Device deleted successfully!");
        fetchDevices();
        fetchStats();
      }
    } catch (error: any) {
      console.error("Delete device error:", error);
      alert(error.response?.data?.message || "Failed to delete device");
    }
  };

  const handleBulkCreate = async () => {
    try {
      setIsUploading(true);
      let devicesData = bulkDevices;

      if (csvFile && !devicesData.length) {
        const text = await csvFile.text();
        devicesData = parseCSV(text);
      }

      if (!devicesData.length) {
        alert("No valid devices found. Please check the format.");
        setIsUploading(false);
        return;
      }

      const response = await apiClient.post("/devices/bulk", { devices: devicesData });
      
      if (response.data.success) {
        setBulkResult(response.data.data);
        setCsvFile(null);
        setBulkDevices([]);
        fetchDevices();
        fetchStats();
      }
    } catch (error: any) {
      console.error("Bulk create error:", error);
      alert(error.response?.data?.message || "Failed to bulk create devices");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkAssign = async () => {
    try {
      if (selectedDevices.length === 0) {
        alert("Please select devices to assign");
        return;
      }

      if (!assignData.schoolCode) {
        alert("Please select a school");
        return;
      }

      setIsAssigning(true);
      const response = await apiClient.post("/devices/bulk-assign", {
        serialNumbers: selectedDevices,
        schoolCode: assignData.schoolCode
      });
      
      if (response.data.success) {
        alert(`Assigned ${response.data.data.successful.length} devices successfully!`);
        setShowAssignModal(false);
        setSelectedDevices([]);
        setAssignData({ serialNumbers: [], schoolCode: "" });
        setSchoolSearch("");
        fetchDevices();
        fetchStats();
      }
    } catch (error: any) {
      console.error("Bulk assign error:", error);
      alert(error.response?.data?.message || "Failed to bulk assign devices");
    } finally {
      setIsAssigning(false);
    }
  };

  const openEditModal = (device: Device) => {
    setSelectedDevice(device);
    setNewDevice({
      serialNumber: device.serialNumber,
      category: device.category,
      brand: device.brand,
      model: device.model,
      schoolCode: device.schoolCode || "",
      status: device.status,
      specifications: device.specifications || "",
      condition: device.condition
    });
    setShowEditModal(true);
  };

  const toggleDeviceSelection = (serialNumber: string) => {
    setSelectedDevices(prev =>
      prev.includes(serialNumber)
        ? prev.filter(s => s !== serialNumber)
        : [...prev, serialNumber]
    );
  };

  const canManage = currentUser?.role === "admin" || currentUser?.role === "rtb-staff";

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: "20px", textAlign: "center" }}>Loading devices...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "20px" }}>
        <h1 style={{ marginBottom: "20px", fontSize: "24px", fontWeight: "bold" }}>
          Device Management
        </h1>

        {/* Statistics */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <h3 style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>Total Devices</h3>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#333" }}>{stats.total}</p>
            </div>
            
            <div style={{ background: "#d4edda", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <h3 style={{ fontSize: "14px", color: "#155724", marginBottom: "10px" }}>Available</h3>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#155724" }}>{stats.byStatus.Available}</p>
            </div>
            
            <div style={{ background: "#cce5ff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <h3 style={{ fontSize: "14px", color: "#004085", marginBottom: "10px" }}>Assigned</h3>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#004085" }}>{stats.byStatus.Assigned}</p>
            </div>
            
            <div style={{ background: "#fff3cd", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <h3 style={{ fontSize: "14px", color: "#856404", marginBottom: "10px" }}>Maintenance</h3>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#856404" }}>{stats.byStatus.Maintenance}</p>
            </div>

            <div style={{ background: "#f8d7da", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <h3 style={{ fontSize: "14px", color: "#721c24", marginBottom: "10px" }}>Written Off</h3>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#721c24" }}>{stats.byStatus["Written Off"]}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canManage && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaPlus /> Add Device
            </button>
            
            <button
              onClick={() => setShowBulkModal(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaUpload /> Bulk Upload
            </button>

            <button
              onClick={() => setShowAssignModal(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaTasks /> Bulk Assign
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by serial number, brand, model, or asset tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: "250px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
          >
            <option value="">All Categories</option>
            <option value="Laptop">Laptop</option>
            <option value="Desktop">Desktop</option>
            <option value="Tablet">Tablet</option>
            <option value="Projector">Projector</option>
            <option value="Others">Others</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Written Off">Written Off</option>
          </select>

          {canManage && (
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
            >
              <option value="">All Schools</option>
              {schools.map(school => (
                <option key={school.id} value={school.schoolCode}>
                  {school.schoolName} ({school.schoolCode})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Devices Table */}
        <div style={{ overflowX: "auto", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                {canManage && (
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>
                    Select
                  </th>
                )}
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Serial Number</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Category</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Brand</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Model</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>School</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Condition</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Asset Tag</th>
                {canManage && (
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                  {canManage && (
                    <td style={{ padding: "12px" }}>
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(device.serialNumber)}
                        onChange={() => toggleDeviceSelection(device.serialNumber)}
                        disabled={device.status === "Assigned"}
                      />
                    </td>
                  )}
                  <td style={{ padding: "12px" }}>{device.serialNumber}</td>
                  <td style={{ padding: "12px" }}>{device.category}</td>
                  <td style={{ padding: "12px" }}>{device.brand}</td>
                  <td style={{ padding: "12px" }}>{device.model}</td>
                  <td style={{ padding: "12px" }}>
                    {device.school ? `${device.school.schoolName} (${device.school.schoolCode})` : "-"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                      backgroundColor:
                        device.status === "Available" ? "#d4edda" :
                        device.status === "Assigned" ? "#cce5ff" :
                        device.status === "Maintenance" ? "#fff3cd" : "#f8d7da",
                      color:
                        device.status === "Available" ? "#155724" :
                        device.status === "Assigned" ? "#004085" :
                        device.status === "Maintenance" ? "#856404" : "#721c24"
                    }}>
                      {device.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>{device.condition}</td>
                  <td style={{ padding: "12px" }}>{device.assetTag || "-"}</td>
                  {canManage && (
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => openEditModal(device)}
                        style={{
                          marginRight: "8px",
                          padding: "6px 12px",
                          backgroundColor: "#ffc107",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 16px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: page === 1 ? "#f5f5f5" : "white",
              cursor: page === 1 ? "not-allowed" : "pointer"
            }}
          >
            Previous
          </button>
          <span style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "white" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "8px 16px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: page === totalPages ? "#f5f5f5" : "white",
              cursor: page === totalPages ? "not-allowed" : "pointer"
            }}
          >
            Next
          </button>
        </div>

        {/* Add Device Modal */}
        {showAddModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              <h2 style={{ marginBottom: "20px" }}>Add New Device</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Serial Number *</label>
                  <input
                    type="text"
                    value={newDevice.serialNumber}
                    onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Category *</label>
                  <select
                    value={newDevice.category}
                    onChange={(e) => setNewDevice({ ...newDevice, category: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Projector">Projector</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Brand *</label>
                  <input
                    type="text"
                    value={newDevice.brand}
                    onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Model *</label>
                  <input
                    type="text"
                    value={newDevice.model}
                    onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>School (Optional)</label>
                  <select
                    value={newDevice.schoolCode}
                    onChange={(e) => setNewDevice({ ...newDevice, schoolCode: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="">No School</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.schoolCode}>
                        {school.schoolName} ({school.schoolCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Status *</label>
                  <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Written Off">Written Off</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Condition *</label>
                  <select
                    value={newDevice.condition}
                    onChange={(e) => setNewDevice({ ...newDevice, condition: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Faulty">Faulty</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1", padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
                  <small style={{ color: "#1976d2" }}>
                    ℹ️ Asset tag will be auto-generated when device is assigned to a school
                    <br />
                    Format: CAT/DIS/SCH/0001 (Category/District/School/Sequence)
                  </small>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Specifications</label>
                  <textarea
                    value={newDevice.specifications}
                    onChange={(e) => setNewDevice({ ...newDevice, specifications: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "60px" }}
                    placeholder="e.g., 8GB RAM/256GB SSD, i5 Processor"
                  />
                </div>
              </div>

              <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDevice({
                      serialNumber: "",
                      category: "Laptop",
                      brand: "",
                      model: "",
                      schoolCode: "",
                      status: "Available",
                      specifications: "",
                      condition: "New"
                    });
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDevice}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Add Device
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Device Modal */}
        {showEditModal && selectedDevice && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              <h2 style={{ marginBottom: "20px" }}>Edit Device</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Serial Number *</label>
                  <input
                    type="text"
                    value={newDevice.serialNumber}
                    onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Category *</label>
                  <select
                    value={newDevice.category}
                    onChange={(e) => setNewDevice({ ...newDevice, category: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Projector">Projector</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Brand *</label>
                  <input
                    type="text"
                    value={newDevice.brand}
                    onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Model *</label>
                  <input
                    type="text"
                    value={newDevice.model}
                    onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>School (Optional)</label>
                  <select
                    value={newDevice.schoolCode}
                    onChange={(e) => setNewDevice({ ...newDevice, schoolCode: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="">No School</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.schoolCode}>
                        {school.schoolName} ({school.schoolCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Status *</label>
                  <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Written Off">Written Off</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Condition *</label>
                  <select
                    value={newDevice.condition}
                    onChange={(e) => setNewDevice({ ...newDevice, condition: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Faulty">Faulty</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1", padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
                  <small style={{ color: "#1976d2" }}>
                    ℹ️ Asset tag will be auto-generated when device is assigned to a school
                    <br />
                    Format: CAT/DIS/SCH/0001 (Category/District/School/Sequence)
                  </small>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Specifications</label>
                  <textarea
                    value={newDevice.specifications}
                    onChange={(e) => setNewDevice({ ...newDevice, specifications: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "60px" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDevice(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditDevice}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#ffc107",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Update Device
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              <h2 style={{ marginBottom: "20px" }}>Bulk Upload Devices</h2>
              
              <div style={{ marginBottom: "20px" }}>
                <button
                  onClick={downloadCSVTemplate}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <FaDownload /> Download CSV Template
                </button>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Option 1: Upload CSV File</h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCsvFile(file);
                  }}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Option 2: Paste JSON</h3>
                <textarea
                  placeholder='[{"serialNumber":"LPT-001","category":"Laptop","brand":"HP","model":"ProBook","status":"Available","condition":"New"}]'
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setBulkDevices(Array.isArray(parsed) ? parsed : [parsed]);
                    } catch (err) {
                      console.error("Invalid JSON");
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    minHeight: "100px",
                    fontFamily: "monospace"
                  }}
                />
              </div>

              {bulkResult && (
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Upload Results</h3>
                  <p style={{ color: "#28a745", marginBottom: "5px" }}>
                    ✓ Successfully created: {bulkResult.successful.length}
                  </p>
                  {bulkResult.failed.length > 0 && (
                    <div>
                      <p style={{ color: "#dc3545", marginBottom: "5px" }}>
                        ✗ Failed: {bulkResult.failed.length}
                      </p>
                      <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
                        {bulkResult.failed.slice(0, 5).map((item, index) => (
                          <li key={index} style={{ fontSize: "14px", color: "#dc3545" }}>
                            {item.serialNumber}: {item.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setCsvFile(null);
                    setBulkDevices([]);
                    setBulkResult(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={(!csvFile && bulkDevices.length === 0) || isUploading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: ((!csvFile && bulkDevices.length === 0) || isUploading) ? "#ccc" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: ((!csvFile && bulkDevices.length === 0) || isUploading) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {isUploading ? (
                    <>
                      <span style={{ 
                        display: "inline-block",
                        width: "16px",
                        height: "16px",
                        border: "2px solid #fff",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite"
                      }} />
                      Uploading...
                    </>
                  ) : (
                    "Upload Devices"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Assign Modal */}
        {showAssignModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px"
            }}>
              <h2 style={{ marginBottom: "20px" }}>Bulk Assign Devices to School</h2>
              
              <p style={{ marginBottom: "15px", color: "#666" }}>
                Selected Devices: <strong>{selectedDevices.length}</strong>
              </p>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Search & Select School *</label>
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  placeholder="Search by school name or code..."
                  style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "10px" }}
                />
                <div style={{ 
                  maxHeight: "200px", 
                  overflowY: "auto", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px",
                  backgroundColor: "#f9f9f9"
                }}>
                  {schools
                    .filter(school => 
                      schoolSearch === "" || 
                      school.schoolName.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                      school.schoolCode.toLowerCase().includes(schoolSearch.toLowerCase())
                    )
                    .map(school => (
                      <div
                        key={school.id}
                        onClick={() => {
                          setAssignData({ ...assignData, schoolCode: school.schoolCode });
                          setSchoolSearch(school.schoolName);
                        }}
                        style={{
                          padding: "10px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                          backgroundColor: assignData.schoolCode === school.schoolCode ? "#e3f2fd" : "transparent",
                          fontWeight: assignData.schoolCode === school.schoolCode ? "500" : "normal"
                        }}
                      >
                        {school.schoolName} ({school.schoolCode})
                        {assignData.schoolCode === school.schoolCode && (
                          <span style={{ marginLeft: "10px", color: "#1976d2" }}>✓</span>
                        )}
                      </div>
                    ))}
                  {schools.filter(school => 
                    schoolSearch === "" || 
                    school.schoolName.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                    school.schoolCode.toLowerCase().includes(schoolSearch.toLowerCase())
                  ).length === 0 && (
                    <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                      No schools found
                    </div>
                  )}
                </div>
                {assignData.schoolCode && (
                  <div style={{ marginTop: "8px", fontSize: "14px", color: "#1976d2" }}>
                    Selected: <strong>{schools.find(s => s.schoolCode === assignData.schoolCode)?.schoolName}</strong>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
                <small style={{ color: "#1976d2" }}>
                  ℹ️ Asset tags will be auto-generated in format: CAT/DIS/SCH/0001
                  <br />
                  (Category/District/School/Sequence)
                </small>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignData({ serialNumbers: [], schoolCode: "" });
                    setSchoolSearch("");
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={isAssigning}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: isAssigning ? "#ccc" : "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isAssigning ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {isAssigning ? (
                    <>
                      <span style={{ 
                        display: "inline-block",
                        width: "16px",
                        height: "16px",
                        border: "2px solid #fff",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite"
                      }} />
                      Assigning...
                    </>
                  ) : (
                    "Assign Devices"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
