import { 
  users, 
  departments, 
  shifts, 
  fcfs_queue, 
  notifications,
  audit_logs,
  type User, 
  type InsertUser,
  type Department,
  type InsertDepartment,
  type Shift,
  type InsertShift,
  type FcfsQueue,
  type InsertFcfsQueue,
  type Notification,
  type InsertNotification,
  type AuditLog,
  type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Shifts
  getShifts(filters?: { 
    status?: string; 
    department_id?: string; 
    start_date?: Date; 
    end_date?: Date;
  }): Promise<Shift[]>;
  getShift(id: string): Promise<Shift | undefined>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: string, updates: Partial<InsertShift>): Promise<Shift>;
  
  // FCFS Queue
  getFcfsQueue(shift_id?: string): Promise<FcfsQueue[]>;
  addToFcfsQueue(entry: InsertFcfsQueue): Promise<FcfsQueue>;
  updateFcfsQueueEntry(id: string, updates: Partial<InsertFcfsQueue>): Promise<FcfsQueue>;
  
  // Notifications
  getUserNotifications(user_id: string, unread_only?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  // Health Check
  healthCheck(): Promise<{ healthy: boolean; message?: string; latency?: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getDepartments(): Promise<Department[]> {
    return await db
      .select()
      .from(departments)
      .where(eq(departments.is_active, true))
      .orderBy(asc(departments.name));
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);
    return department;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    return department;
  }

  async getShifts(filters?: { 
    status?: string; 
    department_id?: string; 
    start_date?: Date; 
    end_date?: Date;
  }): Promise<Shift[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(shifts.status, filters.status));
    }
    if (filters?.department_id) {
      conditions.push(eq(shifts.department_id, filters.department_id));
    }
    if (filters?.start_date) {
      conditions.push(gte(shifts.start_time, filters.start_date));
    }
    if (filters?.end_date) {
      conditions.push(lte(shifts.end_time, filters.end_date));
    }

    const query = db
      .select()
      .from(shifts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(shifts.start_time));

    return await query;
  }

  async getShift(id: string): Promise<Shift | undefined> {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);
    return shift;
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const [shift] = await db
      .insert(shifts)
      .values(insertShift)
      .returning();
    return shift;
  }

  async updateShift(id: string, updates: Partial<InsertShift>): Promise<Shift> {
    const [shift] = await db
      .update(shifts)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(shifts.id, id))
      .returning();
    return shift;
  }

  async getFcfsQueue(shift_id?: string): Promise<FcfsQueue[]> {
    let query = db
      .select()
      .from(fcfs_queue)
      .orderBy(desc(fcfs_queue.priority_score), asc(fcfs_queue.created_at));

    if (shift_id) {
      query = query.where(eq(fcfs_queue.shift_id, shift_id));
    }

    return await query;
  }

  async addToFcfsQueue(entry: InsertFcfsQueue): Promise<FcfsQueue> {
    const [queueEntry] = await db
      .insert(fcfs_queue)
      .values(entry)
      .returning();
    return queueEntry;
  }

  async updateFcfsQueueEntry(id: string, updates: Partial<InsertFcfsQueue>): Promise<FcfsQueue> {
    const [entry] = await db
      .update(fcfs_queue)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(fcfs_queue.id, id))
      .returning();
    return entry;
  }

  async getUserNotifications(user_id: string, unread_only = false): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, user_id));

    if (unread_only) {
      query = query.where(and(
        eq(notifications.user_id, user_id),
        eq(notifications.is_read, false)
      ));
    }

    return await query.orderBy(desc(notifications.created_at));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.id, id));
  }

  async createAuditLog(insertAuditLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(audit_logs)
      .values(insertAuditLog)
      .returning();
    return log;
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string; latency?: number }> {
    try {
      const start = Date.now();
      await db.select().from(users).limit(1);
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        message: "Database connection successful",
        latency
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Database connection failed"
      };
    }
  }
}

export const storage = new DatabaseStorage();
