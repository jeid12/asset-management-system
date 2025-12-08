"use client";

import { useState, useEffect, useRef } from "react";
import { FaBell, FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import apiClient from "../utils/api";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  metadata?: any;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
    }
  }, [showDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get("/notifications/unread-count");
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/notifications?limit=10");
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      fetchUnreadCount();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setShowDropdown(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconStyle = { marginRight: "0.5rem", flexShrink: 0 };
    switch (type) {
      case "application_submitted":
        return <span style={iconStyle}>📝</span>;
      case "application_reviewed":
        return <span style={iconStyle}>👀</span>;
      case "application_approved":
        return <span style={iconStyle}>✅</span>;
      case "application_rejected":
        return <span style={iconStyle}>❌</span>;
      case "devices_assigned":
        return <span style={iconStyle}>📦</span>;
      case "devices_received":
        return <span style={iconStyle}>✔️</span>;
      case "device_assigned":
        return <span style={iconStyle}>💻</span>;
      case "system_alert":
        return <span style={iconStyle}>⚠️</span>;
      default:
        return <span style={iconStyle}>🔔</span>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: "relative",
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          padding: "0.5rem 0.75rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#F9FAFB";
          e.currentTarget.style.borderColor = "#D1D5DB";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "white";
          e.currentTarget.style.borderColor = "#E5E7EB";
        }}
      >
        <FaBell size={18} color="#6B7280" />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#EF4444",
              color: "white",
              borderRadius: "10px",
              padding: "0.125rem 0.375rem",
              fontSize: "0.625rem",
              fontWeight: "bold",
              minWidth: "18px",
              textAlign: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: "0",
            width: "400px",
            maxWidth: "90vw",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
            zIndex: 1000,
            maxHeight: "500px",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #E5E7EB",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid #E5E7EB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#F9FAFB",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#111827" }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#6B7280" }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#3B82F6",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: "600",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#EFF6FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>
                <div style={{ opacity: 0.3, marginBottom: "0.5rem" }}>
                  <FaBell size={32} />
                </div>
                <p style={{ margin: 0 }}>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #F3F4F6",
                    cursor: notification.actionUrl ? "pointer" : "default",
                    background: notification.isRead ? "white" : "#EFF6FF",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start",
                    transition: "background 0.2s",
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  onMouseEnter={(e) => {
                    if (notification.actionUrl) {
                      e.currentTarget.style.background = notification.isRead ? "#F9FAFB" : "#DBEAFE";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.isRead ? "white" : "#EFF6FF";
                  }}
                >
                  <div style={{ paddingTop: "0.125rem" }}>{getNotificationIcon(notification.type)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          fontWeight: notification.isRead ? "500" : "700",
                          color: "#111827",
                        }}
                      >
                        {notification.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#9CA3AF",
                          cursor: "pointer",
                          padding: "0.25rem",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#EF4444";
                          e.currentTarget.style.background = "#FEE2E2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#9CA3AF";
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8125rem",
                        color: "#6B7280",
                        lineHeight: "1.4",
                        wordBreak: "break-word",
                      }}
                    >
                      {notification.message}
                    </p>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.6875rem", color: "#9CA3AF" }}>
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderTop: "1px solid #E5E7EB",
                textAlign: "center",
                background: "#F9FAFB",
                borderRadius: "0 0 12px 12px",
              }}
            >
              <button
                onClick={() => {
                  router.push("/dashboard/notifications");
                  setShowDropdown(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#3B82F6",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  fontWeight: "600",
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#EFF6FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
