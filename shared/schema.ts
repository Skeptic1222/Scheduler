import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("staff"), // admin, supervisor, staff
  department_id: varchar("department_id"),
  skills: jsonb("skills").default('[]'),
  seniority_years: integer("seniority_years").default(0),
  last_shift_date: timestamp("last_shift_date"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  department_id: varchar("department_id").notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  required_skills: jsonb("required_skills").default('[]'),
  min_experience_years: integer("min_experience_years").default(0),
  status: text("status").notNull().default("available"), // available, in_queue, assigned, completed, cancelled
  assigned_user_id: varchar("assigned_user_id"),
  created_by: varchar("created_by").notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const fcfs_queue = pgTable("fcfs_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shift_id: varchar("shift_id").notNull(),
  user_id: varchar("user_id").notNull(),
  priority_score: decimal("priority_score", { precision: 5, scale: 2 }).notNull(),
  response_deadline: timestamp("response_deadline").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined, expired
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  type: text("type").notNull(), // shift_assignment, shift_reminder, system_alert
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").default('{}'),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const audit_logs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id"),
  action: text("action").notNull(),
  resource_type: text("resource_type").notNull(),
  resource_id: varchar("resource_id"),
  details: jsonb("details").default('{}'),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.department_id],
    references: [departments.id],
  }),
  shifts: many(shifts),
  fcfs_queue_entries: many(fcfs_queue),
  notifications: many(notifications),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  shifts: many(shifts),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  department: one(departments, {
    fields: [shifts.department_id],
    references: [departments.id],
  }),
  assigned_user: one(users, {
    fields: [shifts.assigned_user_id],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [shifts.created_by],
    references: [users.id],
  }),
  fcfs_queue_entries: many(fcfs_queue),
}));

export const fcfsQueueRelations = relations(fcfs_queue, ({ one }) => ({
  shift: one(shifts, {
    fields: [fcfs_queue.shift_id],
    references: [shifts.id],
  }),
  user: one(users, {
    fields: [fcfs_queue.user_id],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  created_at: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertFcfsQueueSchema = createInsertSchema(fcfs_queue).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  created_at: true,
});

export const insertAuditLogSchema = createInsertSchema(audit_logs).omit({
  id: true,
  created_at: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

export type FcfsQueue = typeof fcfs_queue.$inferSelect;
export type InsertFcfsQueue = z.infer<typeof insertFcfsQueueSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type AuditLog = typeof audit_logs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
