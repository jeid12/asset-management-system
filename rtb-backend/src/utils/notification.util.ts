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
  const notification = notificationRepository.create({
    userId: params.userId,
    type: params.type as any,
    title: params.title,
    message: params.message,
    metadata: params.metadata,
    actionUrl: params.actionUrl,
    isRead: false,
  });

  return await notificationRepository.save(notification);
};

export const notifyUsersByRole = async (
  role: string,
  type: string,
  title: string,
  message: string,
  metadata?: any,
  actionUrl?: string
): Promise<Notification[]> => {
  const users = await userRepository.find({ where: { role: role as any } });
  
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

  return await notificationRepository.save(notifications);
};

export const notifyAdminAndStaff = async (
  type: string,
  title: string,
  message: string,
  metadata?: any,
  actionUrl?: string
): Promise<Notification[]> => {
  const users = await userRepository
    .createQueryBuilder("user")
    .where("user.role IN (:...roles)", { roles: ["admin", "rtb-staff"] })
    .getMany();

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

  return await notificationRepository.save(notifications);
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
