// src/utils/session.util.ts
import { AppDataSource } from "../data-source";
import { AuditLog } from "../entities/AuditLog";
import { v4 as uuidv4 } from "uuid";

const auditLogRepository = AppDataSource.getRepository(AuditLog);

interface SessionData {
  sessionId: string;
  userId: string;
  ipAddress: string;
  loginTime: Date;
}

// In-memory session store (for production, use Redis)
const activeSessions = new Map<string, SessionData>();

/**
 * Create a new session when user logs in
 */
export const createSession = (userId: string, ipAddress: string): string => {
  const sessionId = uuidv4();
  const sessionData: SessionData = {
    sessionId,
    userId,
    ipAddress,
    loginTime: new Date(),
  };
  
  activeSessions.set(sessionId, sessionData);
  return sessionId;
};

/**
 * Get session data
 */
export const getSession = (sessionId: string): SessionData | undefined => {
  return activeSessions.get(sessionId);
};

/**
 * End session and calculate duration
 */
export const endSession = async (sessionId: string): Promise<void> => {
  const session = activeSessions.get(sessionId);
  
  if (session) {
    const sessionEnd = new Date();
    const sessionDuration = Math.floor((sessionEnd.getTime() - session.loginTime.getTime()) / 1000);
    
    // Update all audit logs for this session with session end time and duration
    await auditLogRepository
      .createQueryBuilder()
      .update(AuditLog)
      .set({
        sessionEnd,
        sessionDuration,
      })
      .where("sessionId = :sessionId", { sessionId })
      .andWhere("sessionEnd IS NULL")
      .execute();
    
    activeSessions.delete(sessionId);
  }
};

/**
 * Calculate active session duration
 */
export const getSessionDuration = (sessionId: string): number => {
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return 0;
  }
  
  const now = new Date();
  return Math.floor((now.getTime() - session.loginTime.getTime()) / 1000);
};

/**
 * Clean up inactive sessions (call periodically)
 */
export const cleanupInactiveSessions = async (inactiveThresholdHours: number = 24): Promise<void> => {
  const now = new Date();
  const thresholdTime = new Date(now.getTime() - inactiveThresholdHours * 60 * 60 * 1000);
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.loginTime < thresholdTime) {
      await endSession(sessionId);
    }
  }
};

/**
 * Get total time spent by user across all sessions
 */
export const getUserTotalTimeSpent = async (userId: string): Promise<number> => {
  const result = await auditLogRepository
    .createQueryBuilder("audit")
    .select("SUM(audit.sessionDuration)", "totalSeconds")
    .where("audit.actorId = :userId", { userId })
    .andWhere("audit.sessionDuration IS NOT NULL")
    .getRawOne();
  
  return parseInt(result?.totalSeconds || "0");
};

/**
 * Get user's active sessions
 */
export const getUserActiveSessions = (userId: string): SessionData[] => {
  const sessions: SessionData[] = [];
  
  for (const session of activeSessions.values()) {
    if (session.userId === userId) {
      sessions.push(session);
    }
  }
  
  return sessions;
};
