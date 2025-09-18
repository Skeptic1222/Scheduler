// SQL Server schema - converted from PostgreSQL schema
import { sql, relations } from "drizzle-orm";
import { varchar, text, datetime2, int, bit, decimal, nvarchar } from "drizzle-orm/mssql-core";
import { mssqlTable } from "drizzle-orm/mssql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users_sqlserver = mssqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`NEWID()`),
  email: nvarchar("email", { length: 255 }).notNull().unique(),
  name: nvarchar("name", { length: 255 }).notNull(),
  role: nvarchar("role", { length: 50 }).notNull().default("staff"), // admin, supervisor, staff
  department_id: varchar("department_id", { length: 36 }),
  skills: nvarchar("skills", { length: "max" }).default('[]'), // JSON string instead of JSONB
  seniority_years: int("seniority_years").default(0),
  last_shift_date: datetime2("last_shift_date"),
  is_active: bit("is_active").default(1),
  created_at: datetime2("created_at").default(sql`GETDATE()`),
  updated_at: datetime2("updated_at").default(sql`GETDATE()`),
});

export const departments_sqlserver = mssqlTable("departments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`NEWID()`),
  name: nvarchar("name", { length: 255 }).notNull(),
  description: nvarchar("description", { length: "max" }),
  is_active: bit("is_active").default(1),
  created_at: datetime2("created_at").default(sql`GETDATE()`),
});

export const shifts_sqlserver = mssqlTable("shifts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`NEWID()`),
  title: nvarchar("title", { length: 255 }).notNull(),
  description: nvarchar("description", { length: "max" }),
  department_id: varchar("department_id", { length: 36 }).notNull(),
  start_time: datetime2("start_time").notNull(),
  end_time: datetime2("end_time").notNull(),
  required_skills: nvarchar("required_skills", { length: "max" }).default('[]'), // JSON string
  min_experience_years: int("min_experience_years").default(0),
  status: nvarchar("status", { length: 50 }).notNull().default("available"), // available, in_queue, assigned, completed, cancelled
  assigned_user_id: varchar("assigned_user_id", { length: 36 }),
  created_by: varchar("created_by", { length: 36 }).notNull(),
  created_at: datetime2("created_at").default(sql`GETDATE()`),
  updated_at: datetime2("updated_at").default(sql`GETDATE()`),
});

export const fcfs_queue_sqlserver = mssqlTable("fcfs_queue", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`NEWID()`),
  shift_id: varchar("shift_id", { length: 36 }).notNull(),
  user_id: varchar("user_id", { length: 36 }).notNull(),
  priority_score: decimal("priority_score", { precision: 5, scale: 2 }).notNull(),
  response_deadline: datetime2("response_deadline").notNull(),
  status: nvarchar("status", { length: 50 }).notNull().default("pending"), // pending, accepted, declined, expired
  created_at: datetime2("created_at").default(sql`GETDATE()`),
  updated_at: datetime2("updated_at").default(sql`GETDATE()`),
});

export const notifications_sqlserver = mssqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`NEWID()`),
  user_id: varchar("user_id", { length: 36 }).notNull(),
  type: nvarchar("type", { length: 100 }).notNull(), // shift_assignment, shift_reminder, system_alert
  title: nvarchar("title", { length: 255 }).notNull(),
  message: nvarchar("message", { length: "max" }).notNull(),
  data: nvarchar("data", { length: "max" }).default('{}'), // JSON string
  is_read: bit("is_read").default(0),
  created_at: datetime2("created_at").default(sql`GETDATE()`),
});

export const audit_logs_sqlserver = mssqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`NEWID()`),
  user_id: varchar("user_id", { length: 36 }),
  action: nvarchar("action", { length: 255 }).notNull(),
  resource_type: nvarchar("resource_type", { length: 100 }).notNull(),
  resource_id: varchar("resource_id", { length: 36 }),
  details: nvarchar("details", { length: "max" }).default('{}'), // JSON string
  ip_address: nvarchar("ip_address", { length: 45 }),
  user_agent: nvarchar("user_agent", { length: "max" }),
  created_at: datetime2("created_at").default(sql`GETDATE()`),
});

// Relations - same as PostgreSQL version
export const usersRelations_sqlserver = relations(users_sqlserver, ({ one, many }) => ({
  department: one(departments_sqlserver, {
    fields: [users_sqlserver.department_id],
    references: [departments_sqlserver.id],
  }),
  shifts: many(shifts_sqlserver),
  fcfs_queue_entries: many(fcfs_queue_sqlserver),
  notifications: many(notifications_sqlserver),
}));

export const departmentsRelations_sqlserver = relations(departments_sqlserver, ({ many }) => ({
  users: many(users_sqlserver),
  shifts: many(shifts_sqlserver),
}));

export const shiftsRelations_sqlserver = relations(shifts_sqlserver, ({ one, many }) => ({
  department: one(departments_sqlserver, {
    fields: [shifts_sqlserver.department_id],
    references: [departments_sqlserver.id],
  }),
  assigned_user: one(users_sqlserver, {
    fields: [shifts_sqlserver.assigned_user_id],
    references: [users_sqlserver.id],
  }),
  creator: one(users_sqlserver, {
    fields: [shifts_sqlserver.created_by],
    references: [users_sqlserver.id],
  }),
  fcfs_queue_entries: many(fcfs_queue_sqlserver),
}));

// Insert schemas
export const insertUserSchema_sqlserver = createInsertSchema(users_sqlserver).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertDepartmentSchema_sqlserver = createInsertSchema(departments_sqlserver).omit({
  id: true,
  created_at: true,
});

export const insertShiftSchema_sqlserver = createInsertSchema(shifts_sqlserver).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types - compatible with original types
export type User_SQLServer = typeof users_sqlserver.$inferSelect;
export type InsertUser_SQLServer = z.infer<typeof insertUserSchema_sqlserver>;

export type Department_SQLServer = typeof departments_sqlserver.$inferSelect;
export type InsertDepartment_SQLServer = z.infer<typeof insertDepartmentSchema_sqlserver>;

export type Shift_SQLServer = typeof shifts_sqlserver.$inferSelect;
export type InsertShift_SQLServer = z.infer<typeof insertShiftSchema_sqlserver>;