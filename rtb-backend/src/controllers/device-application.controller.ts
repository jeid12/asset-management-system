// src/controllers/device-application.controller.ts
import { Response } from "express";
import { AppDataSource } from "../data-source";
import { DeviceApplication } from "../entities/DeviceApplication";
import { School } from "../entities/School";
import { Device } from "../entities/Device";
import { User } from "../entities/User";
import { AuthRequest } from "../middlewares/auth.middleware";
import { validateDto } from "../utils/validator.util";
import {
  CreateDeviceApplicationDto,
  ReviewApplicationDto,
  UpdateEligibilityDto,
  AssignDevicesDto,
  ConfirmReceiptDto,
} from "../dtos/device-application.dto";
import fs from "fs";
import path from "path";

const applicationRepository = AppDataSource.getRepository(DeviceApplication);
const schoolRepository = AppDataSource.getRepository(School);
const deviceRepository = AppDataSource.getRepository(Device);
const userRepository = AppDataSource.getRepository(User);

// Create new application (School users only)
export const createApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Validate DTO
    const errors = await validateDto(CreateDeviceApplicationDto, req.body);
    if (errors.length > 0) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ message: "Application letter (PDF) is required" });
      return;
    }

    // Verify user has school role
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.role !== "school") {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      res.status(403).json({ message: "Only users with school role can submit applications" });
      return;
    }

    // Find school where user is representative
    const school = await schoolRepository.findOne({
      where: { representativeId: userId },
    });

    if (!school) {
      // Delete uploaded file if school not found
      fs.unlinkSync(req.file.path);
      res.status(403).json({ message: "You are not assigned as a representative of any school" });
      return;
    }

    // Check if school has pending application
    const existingApplication = await applicationRepository.findOne({
      where: {
        schoolId: school.id,
        status: "Pending" as any,
      },
    });

    if (existingApplication) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ message: "You already have a pending application" });
      return;
    }

    const {
      purpose,
      justification,
      requestedLaptops,
      requestedDesktops,
      requestedTablets,
      requestedProjectors,
      requestedOthers,
    } = req.body;

    // Create application
    const application = applicationRepository.create({
      schoolId: school.id,
      applicantId: userId!,
      purpose,
      justification,
      requestedLaptops: parseInt(requestedLaptops) || 0,
      requestedDesktops: parseInt(requestedDesktops) || 0,
      requestedTablets: parseInt(requestedTablets) || 0,
      requestedProjectors: parseInt(requestedProjectors) || 0,
      requestedOthers: parseInt(requestedOthers) || 0,
      letterPath: req.file.path,
      status: "Pending",
    });

    await applicationRepository.save(application);

    res.status(201).json({
      message: "Application submitted successfully",
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error("Create application error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all applications (Admin/Staff only)
export const getAllApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, schoolCode } = req.query;

    const queryBuilder = applicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.school", "school")
      .leftJoinAndSelect("application.applicant", "applicant")
      .leftJoinAndSelect("application.reviewer", "reviewer")
      .leftJoinAndSelect("application.assigner", "assigner")
      .orderBy("application.createdAt", "DESC");

    if (status) {
      queryBuilder.andWhere("application.status = :status", { status });
    }

    if (schoolCode) {
      queryBuilder.andWhere("school.schoolCode = :schoolCode", { schoolCode });
    }

    const applications = await queryBuilder.getMany();

    res.status(200).json({
      success: true,
      count: applications.length,
      applications: applications.map((app) => ({
        id: app.id,
        school: {
          name: app.school.schoolName,
          code: app.school.schoolCode,
          district: app.school.district,
        },
        applicant: {
          name: app.applicant.fullName,
          email: app.applicant.email,
        },
        requestedDevices: {
          laptops: app.requestedLaptops,
          desktops: app.requestedDesktops,
          tablets: app.requestedTablets,
          projectors: app.requestedProjectors,
          others: app.requestedOthers,
        },
        purpose: app.purpose,
        status: app.status,
        isEligible: app.isEligible,
        reviewedBy: app.reviewer?.fullName,
        reviewedAt: app.reviewedAt,
        assignedBy: app.assigner?.fullName,
        assignedAt: app.assignedAt,
        createdAt: app.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get my applications (School users)
export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const applications = await applicationRepository.find({
      where: { applicantId: userId },
      relations: ["school", "reviewer", "assigner"],
      order: { createdAt: "DESC" },
    });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications: applications.map((app) => ({
        id: app.id,
        school: {
          name: app.school.schoolName,
          code: app.school.schoolCode,
        },
        requestedDevices: {
          laptops: app.requestedLaptops,
          desktops: app.requestedDesktops,
          tablets: app.requestedTablets,
          projectors: app.requestedProjectors,
          others: app.requestedOthers,
        },
        purpose: app.purpose,
        justification: app.justification,
        status: app.status,
        isEligible: app.isEligible,
        eligibilityNotes: app.eligibilityNotes,
        reviewNotes: app.reviewNotes,
        reviewedBy: app.reviewer?.fullName,
        reviewedAt: app.reviewedAt,
        assignedDevices: app.assignedDevices,
        assignedBy: app.assigner?.fullName,
        assignedAt: app.assignedAt,
        confirmedAt: app.confirmedAt,
        createdAt: app.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get my applications error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single application details
export const getApplicationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const application = await applicationRepository.findOne({
      where: { id },
      relations: ["school", "applicant", "reviewer", "assigner"],
    });

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    // Check authorization - school users can only see their own
    if (userRole === "school" && application.applicantId !== userId) {
      res.status(403).json({ message: "You can only view your own applications" });
      return;
    }

    res.status(200).json({
      success: true,
      application: {
        id: application.id,
        school: {
          id: application.school.id,
          name: application.school.schoolName,
          code: application.school.schoolCode,
          district: application.school.district,
          sector: application.school.sector,
        },
        applicant: {
          id: application.applicant.id,
          name: application.applicant.fullName,
          email: application.applicant.email,
          phoneNumber: application.applicant.phoneNumber,
        },
        requestedDevices: {
          laptops: application.requestedLaptops,
          desktops: application.requestedDesktops,
          tablets: application.requestedTablets,
          projectors: application.requestedProjectors,
          others: application.requestedOthers,
        },
        purpose: application.purpose,
        justification: application.justification,
        letterPath: application.letterPath,
        status: application.status,
        isEligible: application.isEligible,
        eligibilityNotes: application.eligibilityNotes,
        reviewNotes: application.reviewNotes,
        reviewer: application.reviewer
          ? {
              name: application.reviewer.fullName,
              email: application.reviewer.email,
            }
          : null,
        reviewedAt: application.reviewedAt,
        assignedDevices: application.assignedDevices,
        assigner: application.assigner
          ? {
              name: application.assigner.fullName,
              email: application.assigner.email,
            }
          : null,
        assignedAt: application.assignedAt,
        confirmedAt: application.confirmedAt,
        confirmationNotes: application.confirmationNotes,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Download application letter
export const downloadApplicationLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const application = await applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    const filePath = application.letterPath;

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: "Application letter file not found" });
      return;
    }

    res.download(filePath, `application-letter-${application.id}.pdf`);
  } catch (error) {
    console.error("Download letter error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Review application and update eligibility (Admin/Staff only)
export const reviewApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const errors = await validateDto(ReviewApplicationDto, req.body);
    if (errors.length > 0) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const application = await applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (application.status === "Received") {
      res.status(400).json({ message: "Cannot review a completed application" });
      return;
    }

    const { status, reviewNotes, eligibilityNotes } = req.body;

    application.status = status;
    application.reviewNotes = reviewNotes;
    application.eligibilityNotes = eligibilityNotes;
    application.reviewedBy = userId;
    application.reviewedAt = new Date();

    // If approved, mark as eligible by default (can be changed later)
    if (status === "Approved") {
      application.isEligible = true;
    }

    await applicationRepository.save(application);

    res.status(200).json({
      message: "Application reviewed successfully",
      application: {
        id: application.id,
        status: application.status,
        isEligible: application.isEligible,
        reviewedAt: application.reviewedAt,
      },
    });
  } catch (error) {
    console.error("Review application error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update eligibility status (Admin/Staff only)
export const updateEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isEligible, eligibilityNotes } = req.body;

    const application = await applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (application.status === "Pending") {
      res.status(400).json({ message: "Application must be reviewed first" });
      return;
    }

    application.isEligible = isEligible === "true" || isEligible === true;
    application.eligibilityNotes = eligibilityNotes;

    await applicationRepository.save(application);

    res.status(200).json({
      message: "Eligibility updated successfully",
      application: {
        id: application.id,
        isEligible: application.isEligible,
        eligibilityNotes: application.eligibilityNotes,
      },
    });
  } catch (error) {
    console.error("Update eligibility error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Assign devices to approved application (Admin/Staff only)
export const assignDevices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const errors = await validateDto(AssignDevicesDto, req.body);
    if (errors.length > 0) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const application = await applicationRepository.findOne({
      where: { id },
      relations: ["school"],
    });

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (application.status !== "Approved") {
      res.status(400).json({ message: "Only approved applications can have devices assigned" });
      return;
    }

    if (!application.isEligible) {
      res.status(400).json({ message: "Application is not marked as eligible" });
      return;
    }

    const { deviceIds } = req.body;

    // Verify all devices exist and are available
    const devices = await deviceRepository.findByIds(deviceIds);

    if (devices.length !== deviceIds.length) {
      res.status(400).json({ message: "Some devices were not found" });
      return;
    }

    const unavailableDevices = devices.filter((d) => d.status !== "Available");
    if (unavailableDevices.length > 0) {
      res.status(400).json({
        message: "Some devices are not available",
        unavailableDevices: unavailableDevices.map((d) => d.serialNumber),
      });
      return;
    }

    // Assign devices to school
    for (const device of devices) {
      device.status = "Assigned";
      device.schoolCode = application.school.schoolCode;
      await deviceRepository.save(device);
    }

    // Update application
    application.status = "Assigned";
    application.assignedBy = userId;
    application.assignedAt = new Date();
    application.assignedDevices = devices.map((d) => ({
      deviceId: d.id,
      serialNumber: d.serialNumber,
      category: d.category,
    }));

    await applicationRepository.save(application);

    res.status(200).json({
      message: "Devices assigned successfully",
      application: {
        id: application.id,
        status: application.status,
        assignedDevices: application.assignedDevices,
        assignedAt: application.assignedAt,
      },
    });
  } catch (error) {
    console.error("Assign devices error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Confirm receipt of devices (School users only)
export const confirmReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const application = await applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (application.applicantId !== userId) {
      res.status(403).json({ message: "You can only confirm receipt for your own application" });
      return;
    }

    if (application.status !== "Assigned") {
      res.status(400).json({ message: "Devices have not been assigned yet" });
      return;
    }

    const { confirmationNotes } = req.body;

    application.status = "Received";
    application.confirmedAt = new Date();
    application.confirmationNotes = confirmationNotes;

    await applicationRepository.save(application);

    res.status(200).json({
      message: "Receipt confirmed successfully",
      application: {
        id: application.id,
        status: application.status,
        confirmedAt: application.confirmedAt,
      },
    });
  } catch (error) {
    console.error("Confirm receipt error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
