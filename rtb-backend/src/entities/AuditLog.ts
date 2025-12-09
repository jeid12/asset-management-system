// src/entities/AuditLog.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { User } from "./User";

export type ActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "READ"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT"
  | "ASSIGN"
  | "CANCEL"
  | "CONFIRM"
  | "EXPORT"
  | "IMPORT";

export type TargetEntity =
  | "User"
  | "School"
  | "Device"
  | "DeviceApplication"
  | "Notification"
  | "Auth";

@Entity("audit_logs")
@Index(["actorId", "createdAt"])
@Index(["actionType", "createdAt"])
@Index(["targetEntity", "createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Actor Information
  @Column({ type: "uuid", nullable: true })
  actorId?: string;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "actorId" })
  actor?: User;

  @Column({ type: "varchar", length: 255, nullable: true })
  actorName?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  actorRole?: string;

  // Action Information
  @Column({
    type: "enum",
    enum: [
      "CREATE",
      "UPDATE",
      "DELETE",
      "READ",
      "LOGIN",
      "LOGOUT",
      "APPROVE",
      "REJECT",
      "ASSIGN",
      "CANCEL",
      "CONFIRM",
      "EXPORT",
      "IMPORT",
    ],
  })
  actionType: ActionType;

  @Column({ type: "text", nullable: true })
  actionDescription?: string;

  // Target Information
  @Column({
    type: "enum",
    enum: [
      "User",
      "School",
      "Device",
      "DeviceApplication",
      "Notification",
      "Auth",
    ],
  })
  targetEntity: TargetEntity;

  @Column({ type: "varchar", length: 255, nullable: true })
  targetId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  targetName?: string;

  // Changes Information (JSON format for old vs new values)
  @Column({ type: "jsonb", nullable: true })
  changes?: {
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    changedFields?: string[];
  };

  // Request Metadata
  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  userAgent?: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  httpMethod?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  endpoint?: string;

  // Location Information
  @Column({ type: "varchar", length: 100, nullable: true })
  country?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  region?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  timezone?: string;

  // Session Tracking
  @Column({ type: "uuid", nullable: true })
  sessionId?: string;

  @Column({ type: "timestamp", nullable: true })
  sessionStart?: Date;

  @Column({ type: "timestamp", nullable: true })
  sessionEnd?: Date;

  @Column({ type: "int", nullable: true })
  sessionDuration?: number; // in seconds

  // Performance Metrics
  @Column({ type: "int", nullable: true })
  executionDuration?: number; // in milliseconds

  @Column({ type: "int", nullable: true })
  statusCode?: number;

  // Additional Context
  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: "boolean", default: false })
  isSuccess: boolean;

  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  // Timestamp
  @CreateDateColumn()
  createdAt: Date;
}
