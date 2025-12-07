import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("schools")
export class School {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 50 })
  schoolCode: string;

  @Column({ length: 200 })
  schoolName: string;

  @Column({ 
    type: "enum",
    enum: ["TSS", "VTC", "Other"],
    default: "Other"
  })
  category: "TSS" | "VTC" | "Other";

  // Rwanda Administrative Levels
  @Column({ length: 50 })
  province: string;

  @Column({ length: 50 })
  district: string;

  @Column({ length: 50 })
  sector: string;

  @Column({ length: 50, nullable: true })
  cell?: string;

  @Column({ length: 50, nullable: true })
  village?: string;

  // Contact Information
  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  // Representative Relationship
  @Column({ type: "uuid", nullable: true })
  representativeId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "representativeId" })
  representative?: User;

  // Status
  @Column({ 
    type: "enum",
    enum: ["Active", "Inactive"],
    default: "Active"
  })
  status: "Active" | "Inactive";

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
