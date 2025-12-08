import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { School } from "./School";

@Entity("devices")
export class Device {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 100 })
  serialNumber: string;

  @Column({ 
    type: "enum",
    enum: ["Laptop", "Desktop", "Tablet", "Projector", "Others"]
  })
  category: "Laptop" | "Desktop" | "Tablet" | "Projector" | "Others";

  @Column({ length: 100 })
  brand: string;

  @Column({ length: 100 })
  model: string;

  @Column({ nullable: true, length: 50 })
  schoolCode?: string;

  @ManyToOne(() => School, { 
    nullable: true, 
    onDelete: "SET NULL",
    eager: false 
  })
  @JoinColumn({ 
    name: "schoolCode", 
    referencedColumnName: "schoolCode" 
  })
  school?: School;

  @Column({ 
    type: "enum",
    enum: ["Available", "Assigned", "Maintenance", "Written Off"],
    default: "Available"
  })
  status: "Available" | "Assigned" | "Maintenance" | "Written Off";

  @Column({ type: "text", nullable: true })
  specifications?: string;

  @Column({ 
    type: "enum",
    enum: ["New", "Good", "Fair", "Faulty"]
  })
  condition: "New" | "Good" | "Fair" | "Faulty";

  @Column({ nullable: true, length: 100 })
  assetTag?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
