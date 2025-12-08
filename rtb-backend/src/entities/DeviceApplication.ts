import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { School } from "./School";
import { User } from "./User";

@Entity("device_applications")
export class DeviceApplication {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // School Information
  @Column({ type: "uuid" })
  schoolId: string;

  @ManyToOne(() => School, { onDelete: "CASCADE" })
  @JoinColumn({ name: "schoolId" })
  school: School;

  // Applicant (School Representative)
  @Column({ type: "uuid" })
  applicantId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicantId" })
  applicant: User;

  // Application Details
  @Column({ type: "text" })
  purpose: string;

  @Column({ type: "text", nullable: true })
  justification?: string;

  // Requested Devices
  @Column({ type: "int", default: 0 })
  requestedLaptops: number;

  @Column({ type: "int", default: 0 })
  requestedDesktops: number;

  @Column({ type: "int", default: 0 })
  requestedTablets: number;

  @Column({ type: "int", default: 0 })
  requestedProjectors: number;

  @Column({ type: "int", default: 0 })
  requestedOthers: number;

  // Letter Attachment (PDF)
  @Column({ type: "varchar", length: 500 })
  letterPath: string;

  // Application Status
  @Column({
    type: "enum",
    enum: ["Pending", "Under Review", "Approved", "Rejected", "Assigned", "Received", "Cancelled"],
    default: "Pending"
  })
  status: "Pending" | "Under Review" | "Approved" | "Rejected" | "Assigned" | "Received" | "Cancelled";

  // Review Information
  @Column({ type: "uuid", nullable: true })
  reviewedBy?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "reviewedBy" })
  reviewer?: User;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt?: Date;

  @Column({ type: "text", nullable: true })
  reviewNotes?: string;

  @Column({ type: "boolean", default: false })
  isEligible: boolean;

  @Column({ type: "text", nullable: true })
  eligibilityNotes?: string;

  // Assignment Information
  @Column({ type: "uuid", nullable: true })
  assignedBy?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "assignedBy" })
  assigner?: User;

  @Column({ type: "timestamp", nullable: true })
  assignedAt?: Date;

  @Column({ type: "jsonb", nullable: true })
  assignedDevices?: {
    deviceId: string;
    serialNumber: string;
    category: string;
  }[];

  // Confirmation Information
  @Column({ type: "timestamp", nullable: true })
  confirmedAt?: Date;

  @Column({ type: "text", nullable: true })
  confirmationNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
