// src/controllers/notification.controller.ts
import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Notification } from "../entities/Notification";
import { AuthRequest } from "../middlewares/auth.middleware";
import { markNotificationAsRead, markAllAsRead, deleteNotification } from "../utils/notification.util";

const notificationRepository = AppDataSource.getRepository(Notification);

// Get all notifications for current user
export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const queryBuilder = notificationRepository
      .createQueryBuilder("notification")
      .where("notification.userId = :userId", { userId })
      .orderBy("notification.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (unreadOnly) {
      queryBuilder.andWhere("notification.isRead = :isRead", { isRead: false });
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    const unreadCount = await notificationRepository.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// Get unread count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const count = await notificationRepository.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error("Get unread count error:", error);
    res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    await markNotificationAsRead(id);

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error: any) {
    console.error("Mark as read error:", error);
    res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    await markAllAsRead(userId!);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};

// Delete notification
export const removeNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    await deleteNotification(id);

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error: any) {
    console.error("Delete notification error:", error);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

// Delete all read notifications
export const clearReadNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    await notificationRepository.delete({
      userId,
      isRead: true,
    });

    res.json({
      success: true,
      message: "Read notifications cleared",
    });
  } catch (error: any) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to clear notifications" });
  }
};
