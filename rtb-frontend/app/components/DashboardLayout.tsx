// app/components/DashboardLayout.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaLaptop, FaUsers, FaBell, FaFileAlt, FaCog, FaHome, FaSchool, FaClipboardList, FaClipboardCheck, FaBars, FaTimes } from "react-icons/fa";
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
          { label: "Applications", href: "/dashboard/admin/applications", icon: FaClipboardList },
          ...(currentUser?.role === "admin" 
            ? [{ label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: FaClipboardCheck }]
            : []
          )
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
    <div className="dashboard-wrapper">
      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .sidebar {
          width: ${isSidebarCollapsed ? "80px" : "250px"};
          background-color: #1e3a8a;
          color: white;
          padding: 2rem 0;
          position: fixed;
          height: 100vh;
          left: 0;
          top: 0;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 1000;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 280px;
            transform: ${isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)"};
          }
        }

        .mobile-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-overlay {
            display: ${isMobileMenuOpen ? "block" : "none"};
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
          }
        }

        .main-content {
          margin-left: ${isSidebarCollapsed ? "80px" : "250px"};
          width: ${isSidebarCollapsed ? "calc(100% - 80px)" : "calc(100% - 250px)"};
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            width: 100%;
          }
        }

        .header {
          background: white;
          border-bottom: 1px solid #E5E7EB;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 768px) {
          .header {
            padding: 1rem;
          }
        }

        .mobile-menu-btn {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1e3a8a;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 0.5rem;
            cursor: pointer;
            margin-right: 1rem;
          }
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-title h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }

        @media (max-width: 768px) {
          .header-title h1 {
            font-size: 1.125rem;
          }
        }

        .header-subtitle {
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
          color: #6B7280;
        }

        @media (max-width: 640px) {
          .header-subtitle {
            display: none;
          }
        }

        main {
          padding: 2rem;
          flex: 1;
        }

        @media (max-width: 768px) {
          main {
            padding: 1rem;
          }
        }
      `}</style>

      {/* Mobile Overlay */}
      <div 
        className="mobile-overlay" 
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Vertical Sidebar */}
      <aside className="sidebar">
        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            backgroundColor: "rgba(96, 165, 250, 0.2)",
            border: "1px solid rgba(96, 165, 250, 0.3)",
            color: "white",
            padding: "0.5rem",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(96, 165, 250, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(96, 165, 250, 0.2)";
          }}
          className="desktop-only"
        >
          {isSidebarCollapsed ? <FaBars size="1rem" /> : <FaTimes size="1rem" />}
        </button>

        <style jsx>{`
          .desktop-only {
            display: flex;
          }
          @media (max-width: 768px) {
            .desktop-only {
              display: none !important;
            }
          }
        `}</style>

        {/* Logo/Brand */}
        <div style={{ 
          padding: isSidebarCollapsed ? "3rem 0.5rem 1rem" : "3rem 1rem 1rem", 
          marginBottom: "1.5rem", 
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)", 
          textAlign: "center",
          transition: "padding 0.3s ease"
        }}>
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "12px", 
            padding: "0.5rem", 
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: isSidebarCollapsed ? "0" : "0.75rem",
            width: isSidebarCollapsed ? "40px" : "60px",
            height: isSidebarCollapsed ? "40px" : "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease"
          }}>
            <img 
              src="/images/logo.jpg" 
              alt="Rwanda TVET Board" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          {!isSidebarCollapsed && (
            <>
              <h2 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", lineHeight: "1.3", letterSpacing: "0.02em" }}>Rwanda TVET Board</h2>
              <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.65rem", opacity: 0.9, fontWeight: "500" }}>Asset Management</p>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.6rem", opacity: 0.7, fontStyle: "italic" }}>rtb.gov.rw</p>
            </>
          )}
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
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                gap: "0.75rem",
                padding: isSidebarCollapsed ? "1rem 0" : "1rem 1.5rem",
                color: "white",
                textDecoration: "none",
                borderLeft: isActive(item.href) ? "4px solid #60a5fa" : "4px solid transparent",
                backgroundColor: isActive(item.href) ? "rgba(96, 165, 250, 0.1)" : "transparent",
                transition: "all 0.3s ease",
                fontSize: "0.95rem",
                fontWeight: isActive(item.href) ? "600" : "500",
                position: "relative",
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
              title={isSidebarCollapsed ? item.label : ""}
            >
              <item.icon size="1.25rem" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
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
            padding: isSidebarCollapsed ? "0 1rem" : "0 1.5rem",
            transition: "padding 0.3s ease",
          }}
        >
          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: isSidebarCollapsed ? "center" : "flex-start",
              gap: "0.75rem",
              padding: isSidebarCollapsed ? "0.75rem" : "0.75rem 1rem",
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
            title={isSidebarCollapsed ? "Settings" : ""}
          >
            <FaCog size="1.25rem" />
            {!isSidebarCollapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area with Header */}
      <div className="main-content">
        {/* Top Header Bar */}
        <header className="header">
          <div className="header-left">
            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <FaBars size="1.25rem" />
            </button>
            
            <div className="header-title">
              <h1>
                {currentUser?.role === "admin" && "Admin Dashboard"}
                {currentUser?.role === "rtb-staff" && "Staff Dashboard"}
                {currentUser?.role === "headteacher" && "Headteacher Dashboard"}
                {currentUser?.role === "school-staff" && "School Staff Dashboard"}
              </h1>
              <p className="header-subtitle">
                Welcome back, {currentUser?.fullName || "User"}
              </p>
            </div>
          </div>
          <NotificationBell />
        </header>

        {/* Main Content */}
        <main>
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
