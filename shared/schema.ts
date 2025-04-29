import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, uuid, json, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'admin', 'student', 'teacher', 'educational_center', 'certification_partner'
]);

export const courseStatusEnum = pgEnum('course_status', [
  'draft', 'published', 'archived'
]);

export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'active', 'completed', 'cancelled', 'pending'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'paid', 'failed', 'refunded'
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new', 'contacted', 'qualified', 'converted', 'lost'
]);

// Tenants (Educational institutions)
export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#3B82F6'),
  secondaryColor: text('secondary_color').default('#10B981'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    emailUnique: unique().on(table.email, table.tenantId),
    usernameUnique: unique().on(table.username, table.tenantId),
  };
});

// Courses
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  shortDescription: text('short_description'),
  description: text('description'),
  category: text('category'),
  imageUrl: text('image_url'),
  price: integer('price'), // in cents
  status: courseStatusEnum('status').default('draft').notNull(),
  teacherId: integer('teacher_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Modules (Sections of a course)
export const modules = pgTable('modules', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Lessons
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => modules.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  content: text('content'),
  videoUrl: text('video_url'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Enrollments
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: enrollmentStatusEnum('status').default('active').notNull(),
  progress: integer('progress').default(0).notNull(), // percentage
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    uniqueEnrollment: unique().on(table.courseId, table.studentId),
  };
});

// Progress tracking
export const lessonProgress = pgTable('lesson_progress', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  enrollmentId: integer('enrollment_id').references(() => enrollments.id, { onDelete: 'cascade' }).notNull(),
  completed: boolean('completed').default(false).notNull(),
  timeSpent: integer('time_spent').default(0), // in seconds
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    uniqueProgress: unique().on(table.lessonId, table.enrollmentId),
  };
});

// Payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id),
  amount: integer('amount').notNull(), // in cents
  status: paymentStatusEnum('status').default('pending').notNull(),
  paymentMethod: text('payment_method'),
  transactionId: text('transaction_id'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Leads (CRM)
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  courseInterest: integer('course_interest').references(() => courses.id),
  status: leadStatusEnum('status').default('new').notNull(),
  source: text('source'),
  notes: text('notes'),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Knowledge Base
export const aiKnowledgeBase = pgTable('ai_knowledge_base', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Productivity tracking
export const productivityLogs = pgTable('productivity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  activityType: text('activity_type').notNull(),
  resourceId: text('resource_id'),
  duration: integer('duration'), // in seconds
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Create insert/select schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
