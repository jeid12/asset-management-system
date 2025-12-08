// src/entities/Notification.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

export type NotificationType = 
  | "application_submitted"
  | "application_reviewed"
  | "application_approved"
  | "application_rejected"
  | "devices_assigned"
  | "devices_received"
  | "device_assigned"
  | "device_maintenance"
  | "school_created"
  | "user_created"
  | "system_alert";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({
    type: "enum",
    enum: [
      "application_submitted",
      "application_reviewed",
      "application_approved",
      "application_rejected",
      "devices_assigned",
      "devices_received",
      "device_assigned",
      "device_maintenance",
      "school_created",
      "user_created",
      "system_alert",
    ],
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column("text")
  message: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: any;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  actionUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
