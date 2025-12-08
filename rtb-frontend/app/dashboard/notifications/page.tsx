"use client";

import { useState, useEffect } from "react";
import { FaBell, FaCheck, FaTrash, FaFilter } from "react-icons/fa";
import apiClient from "../../utils/api";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";

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

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === "unread") {
        params.append("unreadOnly", "true");
      }
      params.append("page", page.toString());
      params.append("limit", "20");
      
      const response = await apiClient.get(`/notifications?${params.toString()}`);
      
      if (page === 1) {
        setNotifications(response.data.data || []);
      } else {
        setNotifications((prev) => [...prev, ...(response.data.data || [])]);
      }
      
      setUnreadCount(response.data.unreadCount || 0);
      setHasMore((response.data.data || []).length === 20);
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
      fetchNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const clearReadNotifications = async () => {
    try {
      await apiClient.delete("/notifications/clear-read");
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      fetchNotifications();
    } catch (error) {
      console.error("Failed to clear read notifications:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application_submitted":
        return "📝";
      case "application_reviewed":
        return "👀";
      case "application_approved":
        return "✅";
      case "application_rejected":
        return "❌";
      case "devices_assigned":
        return "📦";
      case "devices_received":
        return "✔️";
      case "device_assigned":
        return "💻";
      case "system_alert":
        return "⚠️";
      default:
        return "🔔";
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
    <DashboardLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "1.5rem 2rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "700", color: "#111827" }}>
              Notifications
            </h1>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "#6B7280" }}>
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "#3B82F6",
                  color: "white",
                  border: "none",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2563EB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3B82F6";
                }}
              >
                <FaCheck size={14} />
                Mark all read
              </button>
            )}
            {notifications.some((n) => n.isRead) && (
              <button
                onClick={clearReadNotifications}
                style={{
                  background: "#EF4444",
                  color: "white",
                  border: "none",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#DC2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#EF4444";
                }}
              >
                <FaTrash size={14} />
                Clear read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "1rem", borderTop: "1px solid #E5E7EB", paddingTop: "1rem" }}>
          <button
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            style={{
              background: filter === "all" ? "#EFF6FF" : "transparent",
              color: filter === "all" ? "#3B82F6" : "#6B7280",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
          >
            All Notifications
          </button>
          <button
            onClick={() => {
              setFilter("unread");
              setPage(1);
            }}
            style={{
              background: filter === "unread" ? "#EFF6FF" : "transparent",
              color: filter === "unread" ? "#3B82F6" : "#6B7280",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Unread
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#EF4444",
                  color: "white",
                  borderRadius: "10px",
                  padding: "0.125rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        {loading && page === 1 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#6B7280" }}>
            <div style={{ marginBottom: "1rem" }}>
              <FaBell size={48} color="#D1D5DB" />
            </div>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#6B7280" }}>
            <div style={{ marginBottom: "1rem" }}>
              <FaBell size={48} color="#D1D5DB" />
            </div>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: "500" }}>
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>
              {filter === "unread"
                ? "You're all caught up!"
                : "Notifications will appear here when you receive them"}
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: index < notifications.length - 1 ? "1px solid #F3F4F6" : "none",
                  cursor: notification.actionUrl ? "pointer" : "default",
                  background: notification.isRead ? "white" : "#EFF6FF",
                  display: "flex",
                  gap: "1rem",
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
                <div style={{ fontSize: "2rem", paddingTop: "0.25rem", flexShrink: 0 }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1rem",
                        fontWeight: notification.isRead ? "500" : "700",
                        color: "#111827",
                      }}
                    >
                      {notification.title}
                    </h3>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#9CA3AF", whiteSpace: "nowrap" }}>
                        {formatTimeAgo(notification.createdAt)}
                      </span>
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
                          padding: "0.375rem",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          transition: "all 0.2s",
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
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontSize: "0.9375rem",
                      color: "#4B5563",
                      lineHeight: "1.5",
                      wordBreak: "break-word",
                    }}
                  >
                    {notification.message}
                  </p>
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      style={{
                        marginTop: "0.75rem",
                        background: "transparent",
                        border: "1px solid #3B82F6",
                        color: "#3B82F6",
                        padding: "0.375rem 0.75rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#EFF6FF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FaCheck size={12} />
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div style={{ padding: "1.5rem", textAlign: "center", borderTop: "1px solid #F3F4F6" }}>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  style={{
                    background: loading ? "#E5E7EB" : "#3B82F6",
                    color: "white",
                    border: "none",
                    padding: "0.75rem 2rem",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.background = "#2563EB";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.background = "#3B82F6";
                  }}
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
