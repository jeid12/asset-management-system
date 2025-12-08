// app/components/DashboardLayout.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaLaptop, FaUsers, FaBell, FaFileAlt, FaCog, FaHome, FaSchool, FaClipboardList } from "react-icons/fa";
import SettingsModal from "../dashboard/SettingsModal";
import NotificationBell from "./NotificationBell";
import apiClient from "@/app/utils/api";

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

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch current user profile
    const fetchUser = async () => {
      try {
        const response = await apiClient.get("/profile/me");
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  // Conditionally show Users and Schools links based on role
  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", icon: FaHome },
    { label: "Devices", href: "/dashboard/devices", icon: FaLaptop },
    ...(currentUser?.role === "admin" || currentUser?.role === "rtb-staff" 
      ? [
          { label: "Users", href: "/dashboard/users", icon: FaUsers },
          { label: "Schools", href: "/dashboard/schools", icon: FaSchool },
          { label: "Applications", href: "/dashboard/admin/applications", icon: FaClipboardList }
        ] 
      : currentUser?.role === "school"
      ? [
          { label: "Schools", href: "/dashboard/schools", icon: FaSchool },
          { label: "My Applications", href: "/dashboard/applications", icon: FaClipboardList }
        ]
      : []
    ),
    { label: "Notifications", href: "/dashboard/notifications", icon: FaBell },
    { label: "Reports", href: "/dashboard/reports", icon: FaFileAlt },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href !== "/dashboard" && pathname.includes(href)) return true;
    return false;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Vertical Sidebar */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "#1e3a8a",
          color: "white",
          padding: "2rem 0",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Logo/Brand */}
        <div style={{ padding: "1rem 1rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", textAlign: "center" }}>
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "12px", 
            padding: "0.75rem 1rem", 
            marginBottom: "0.75rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#1e3a8a", letterSpacing: "0.05em" }}>RTB</div>
            <div style={{ fontSize: "0.5rem", color: "#4B5563", marginTop: "0.15rem", fontWeight: "600" }}>TVET BOARD</div>
          </div>
          <h2 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", lineHeight: "1.3", letterSpacing: "0.02em" }}>Rwanda TVET Board</h2>
          <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.65rem", opacity: 0.9, fontWeight: "500" }}>Asset Management</p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.6rem", opacity: 0.7, fontStyle: "italic" }}>rtb.gov.rw</p>
        </div>

        {/* Navigation Items */}
        <nav>
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 1.5rem",
                color: "white",
                textDecoration: "none",
                borderLeft: isActive(item.href) ? "4px solid #60a5fa" : "4px solid transparent",
                backgroundColor: isActive(item.href) ? "rgba(96, 165, 250, 0.1)" : "transparent",
                transition: "all 0.3s ease",
                fontSize: "0.95rem",
                fontWeight: isActive(item.href) ? "600" : "500",
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.backgroundColor = "rgba(96, 165, 250, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <item.icon size="1.25rem" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Settings Button at Bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: 0,
            right: 0,
            padding: "0 1.5rem",
          }}
        >
          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(96, 165, 250, 0.1)",
              color: "#60a5fa",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: "500",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(96, 165, 250, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(96, 165, 250, 0.1)";
            }}
          >
            <FaCog size="1.25rem" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Header */}
      <div style={{ marginLeft: "250px", width: "calc(100% - 250px)", display: "flex", flexDirection: "column" }}>
        {/* Top Header Bar */}
        <header
          style={{
            background: "white",
            borderBottom: "1px solid #E5E7EB",
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700", color: "#111827" }}>
              {currentUser?.role === "admin" && "Admin Dashboard"}
              {currentUser?.role === "rtb-staff" && "Staff Dashboard"}
              {currentUser?.role === "headteacher" && "Headteacher Dashboard"}
              {currentUser?.role === "school-staff" && "School Staff Dashboard"}
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#6B7280" }}>
              Welcome back, {currentUser?.fullName || "User"}
            </p>
          </div>
          <NotificationBell />
        </header>

        {/* Main Content */}
        <main style={{ padding: "2rem", flex: 1 }}>
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={currentUser}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}
