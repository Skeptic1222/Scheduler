// SQL Server schema - Type definitions and SQL templates
// Note: Drizzle doesn't support SQL Server yet, so we use raw SQL with the mssql adapter
import { z } from "zod";

// Type definitions compatible with the original PostgreSQL schema
export interface User_SQLServer {
  id: string;
  email: string;
  name: string;
  role: string;
  department_id?: string | null;
  skills: string; // JSON string instead of JSONB
  seniority_years: number;
  last_shift_date?: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Department_SQLServer {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface Shift_SQLServer {
  id: string;
  title: string;
  description?: string | null;
  department_id: string;
  start_time: Date;
  end_time: Date;
  required_skills: string; // JSON string
  min_experience_years: number;
  status: string;
  assigned_user_id?: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface FcfsQueue_SQLServer {
  id: string;
  shift_id: string;
  user_id: string;
  priority_score: number;
  response_deadline: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notification_SQLServer {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: string; // JSON string
  is_read: boolean;
  created_at: Date;
}

export interface AuditLog_SQLServer {
  id: string;
  user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details: string; // JSON string
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date;
}

// Zod schemas for validation
export const insertUserSchema_SQLServer = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string().default("staff"),
  department_id: z.string().optional(),
  skills: z.string().default('[]'),
  seniority_years: z.number().default(0),
  last_shift_date: z.date().optional(),
  is_active: z.boolean().default(true),
});

export const insertDepartmentSchema_SQLServer = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const insertShiftSchema_SQLServer = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  department_id: z.string(),
  start_time: z.date(),
  end_time: z.date(),
  required_skills: z.string().default('[]'),
  min_experience_years: z.number().default(0),
  status: z.string().default("available"),
  assigned_user_id: z.string().optional(),
  created_by: z.string(),
});

// Type aliases for compatibility
export type InsertUser_SQLServer = z.infer<typeof insertUserSchema_SQLServer>;
export type InsertDepartment_SQLServer = z.infer<typeof insertDepartmentSchema_SQLServer>;
export type InsertShift_SQLServer = z.infer<typeof insertShiftSchema_SQLServer>;