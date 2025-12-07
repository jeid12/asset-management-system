"use client";

import { useEffect, useState } from "react";
import { FaLaptop, FaDesktop, FaBox, FaUsers, FaUserTie, FaUserGraduate, FaUserShield } from "react-icons/fa";
import { useRouter } from "next/navigation";
import apiClient from "@/app/utils/api";
import DashboardLayout from "@/app/components/DashboardLayout";
import { getToken } from "@/app/utils/auth";

interface IconProps {
  icon: React.ComponentType<any>;
  color?: string;
  size?: string;
}

const StatCard = ({ 
  icon: IconComponent, 
  label, 
  count, 
  color,
  bgColor 
}: { 
  icon: React.ComponentType<any>
  label: string
  count: number
  color: string
  bgColor: string
}) => (
  <div
    style={{
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      display: "flex",
      alignItems: "center",
      gap: "1.5rem",
      transition: "all 0.3s ease",
      cursor: "pointer",
      border: `2px solid ${bgColor}20`,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.15)";
      e.currentTarget.style.transform = "translateY(-4px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div
      style={{
        width: "60px",
        height: "60px",
        borderRadius: "12px",
        backgroundColor: `${bgColor}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <IconComponent size="32" color={color} />
    </div>
    <div>
      <p style={{ margin: 0, color: "#666", fontSize: "0.875rem", fontWeight: "500" }}>{label}</p>
      <p style={{ margin: "0.5rem 0 0 0", fontSize: "2rem", fontWeight: "bold", color }}>
        {count}
      </p>
    </div>
  </div>
);

const DashboardPage = () => {
  const router = useRouter();
  const token = getToken();

  // Device counts
  const [laptopCount, setLaptopCount] = useState(0);
  const [projectorCount, setProjectorCount] = useState(0);
  const [otherDeviceCount, setOtherDeviceCount] = useState(0);

  // User counts by role
  const [staffCount, setStaffCount] = useState(0);
  const [headTeacherCount, setHeadTeacherCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch current user profile
        const profileRes = await apiClient.get("/profile/me");
        // In a real scenario, you'd fetch actual counts from the backend
        // For now, setting mock data
        setStaffCount(12);
        setHeadTeacherCount(3);
        setAdminCount(2);

        // Fetch devices count
        setLaptopCount(45);
        setProjectorCount(8);
        setOtherDeviceCount(15);

        setError("");
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, router]);

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "15px",
    border: "1px solid #e0e0e0",
    minHeight: "200px",
  };

  const subCardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    padding: "1rem",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "1400px" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e3a8a", margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Welcome back! Here's your system overview.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        {/* Devices Section */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e3a8a", marginBottom: "1.5rem" }}>
            📦 Devices Overview
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <StatCard
              icon={FaLaptop}
              label="Laptops"
              count={laptopCount}
              color="#3b82f6"
              bgColor="#3b82f6"
            />
            <StatCard
              icon={FaDesktop}
              label="Projectors"
              count={projectorCount}
              color="#10b981"
              bgColor="#10b981"
            />
            <StatCard
              icon={FaBox}
              label="Other Devices"
              count={otherDeviceCount}
              color="#f59e0b"
              bgColor="#f59e0b"
            />
          </div>
        </div>

        {/* Users Section */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e3a8a", marginBottom: "1.5rem" }}>
            👥 Users Overview
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <StatCard
              icon={FaUsers}
              label="Staff Members"
              count={staffCount}
              color="#8b5cf6"
              bgColor="#8b5cf6"
            />
            <StatCard
              icon={FaUserGraduate}
              label="Head Teachers"
              count={headTeacherCount}
              color="#ec4899"
              bgColor="#ec4899"
            />
            <StatCard
              icon={FaUserShield}
              label="Administrators"
              count={adminCount}
              color="#ef4444"
              bgColor="#ef4444"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1e3a8a", marginBottom: "1.5rem" }}>
            📊 Summary Statistics
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
                borderLeft: "4px solid #3b82f6",
              }}
            >
              <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>Total Devices</p>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold", color: "#3b82f6" }}>
                {laptopCount + projectorCount + otherDeviceCount}
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f0fdf4",
                borderRadius: "8px",
                borderLeft: "4px solid #10b981",
              }}
            >
              <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>Total Users</p>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>
                {staffCount + headTeacherCount + adminCount}
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#fef3c7",
                borderRadius: "8px",
                borderLeft: "4px solid #f59e0b",
              }}
            >
              <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>System Status</p>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold", color: "#f59e0b" }}>
                Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
