// src/utils/notification.util.ts
import { AppDataSource } from "../data-source";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";

const notificationRepository = AppDataSource.getRepository(Notification);
const userRepository = AppDataSource.getRepository(User);

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  actionUrl?: string;
}

export const createNotification = async (params: CreateNotificationParams): Promise<Notification> => {
  try {
    console.log("📬 Creating notification:", { userId: params.userId, type: params.type, title: params.title });
    
    const notification = notificationRepository.create({
      userId: params.userId,
      type: params.type as any,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
      actionUrl: params.actionUrl,
      isRead: false,
    });

    const saved = await notificationRepository.save(notification);
    console.log("✅ Notification created successfully:", saved.id);
    return saved;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
};

export const notifyUsersByRole = async (
  role: string,
  type: string,
  title: string,
  message: string,
  metadata?: any,
  actionUrl?: string
): Promise<Notification[]> => {
  try {
    console.log("📬 Notifying users by role:", role);
    
    const users = await userRepository.find({ where: { role: role as any } });
    console.log(`👥 Found ${users.length} users with role: ${role}`);
    
    if (users.length === 0) {
      console.log("⚠️ No users found with role:", role);
      return [];
    }
    
    const notifications = users.map((user) =>
      notificationRepository.create({
        userId: user.id,
        type: type as any,
        title,
        message,
        metadata,
        actionUrl,
        isRead: false,
      })
    );

    const saved = await notificationRepository.save(notifications);
    console.log(`✅ Created ${saved.length} notifications for role: ${role}`);
    return saved;
  } catch (error) {
    console.error("❌ Error notifying users by role:", error);
    throw error;
  }
};

export const notifyAdminAndStaff = async (
  type: string,
  title: string,
  message: string,
  metadata?: any,
  actionUrl?: string
): Promise<Notification[]> => {
  try {
    console.log("📬 Notifying admin and staff");
    
    const users = await userRepository
      .createQueryBuilder("user")
      .where("user.role IN (:...roles)", { roles: ["admin", "rtb-staff"] })
      .getMany();
    
    console.log(`👥 Found ${users.length} admin/staff users`);
    
    if (users.length === 0) {
      console.log("⚠️ No admin or staff users found!");
      return [];
    }

    const notifications = users.map((user) =>
      notificationRepository.create({
        userId: user.id,
        type: type as any,
        title,
        message,
        metadata,
        actionUrl,
        isRead: false,
      })
    );

    const saved = await notificationRepository.save(notifications);
    console.log(`✅ Created ${saved.length} notifications for admin/staff`);
    return saved;
  } catch (error) {
    console.error("❌ Error notifying admin and staff:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await notificationRepository.update(notificationId, { isRead: true });
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  await notificationRepository.update({ userId, isRead: false }, { isRead: true });
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await notificationRepository.delete(notificationId);
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return await notificationRepository.count({ where: { userId, isRead: false } });
};
