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

export const classStatusEnum = pgEnum('class_status', [
  'scheduled', 'in_progress', 'completed', 'cancelled'
]);

export const assessmentTypeEnum = pgEnum('assessment_type', [
  'exam', 'assignment', 'project', 'quiz', 'presentation', 'participation'
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
  code: integer('code').notNull(), // código numérico único para o curso
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  shortDescription: text('short_description'),
  description: text('description'),
  area: text('category'), // mantém o nome da coluna no banco como 'category' para compatibilidade
  courseCategory: text('course_category'), // novo campo para as categorias educacionais
  imageUrl: text('image_url'),
  price: integer('price'), // in cents
  status: courseStatusEnum('status').default('draft').notNull(),
  teacherId: integer('teacher_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    codeUnique: unique().on(table.code, table.tenantId), // garantir que o código é único por tenant
  };
});

// Subjects (Disciplines)
export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  workload: integer('workload'), // Carga horária em horas
  area: text('area'),
  isActive: boolean('is_active').default(true).notNull(),
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

// Classes (Turmas)
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  // Note: courseId está ausente no banco de dados; adicionaremos em uma migração futura quando necessário
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  maxStudents: integer('max_students'),
  teacherId: integer('teacher_id').references(() => users.id),
  status: classStatusEnum('status').default('scheduled').notNull(),
  location: text('location'), // Pode ser uma sala física ou link de aula online
  scheduleInfo: json('schedule_info'), // Para armazenar informações de horário (dias da semana, hora)
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    codeUnique: unique().on(table.code, table.tenantId), // garantir que o código é único por tenant
  };
});

// Matriculas de alunos em turmas específicas
export const classEnrollments = pgTable('class_enrollments', {
  id: serial('id').primaryKey(),
  classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  enrollmentId: integer('enrollment_id').references(() => enrollments.id), // Opcional - referência à matrícula no curso
  enrollmentDate: timestamp('enrollment_date').defaultNow().notNull(),
  status: enrollmentStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    uniqueClassEnrollment: unique().on(table.classId, table.studentId),
  };
});

// Assessments (Avaliações)
export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: assessmentTypeEnum('type').notNull(),
  totalPoints: integer('total_points').notNull().default(100),
  weight: integer('weight').notNull().default(1), // Peso da avaliação no cálculo da nota final
  dueDate: timestamp('due_date'),
  availableFrom: timestamp('available_from'),
  availableTo: timestamp('available_to'),
  isActive: boolean('is_active').default(true).notNull(),
  instructions: text('instructions'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Assessment Results (Notas/Resultados de Avaliações)
export const assessmentResults = pgTable('assessment_results', {
  id: serial('id').primaryKey(),
  assessmentId: integer('assessment_id').references(() => assessments.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score'),
  feedback: text('feedback'),
  submittedAt: timestamp('submitted_at'),
  gradedAt: timestamp('graded_at'),
  gradedBy: integer('graded_by').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').default('pending').notNull(), // pending, submitted, graded
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    uniqueAssessmentResult: unique().on(table.assessmentId, table.studentId),
  };
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
  code: true, // Omitir o código, pois será gerado pelo sistema
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

// Esquemas e Tipos para Módulos e Aulas
export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

// Schema para Subjects (Disciplinas)
export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

// Schemas para Classes (Turmas)
export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = z.infer<typeof insertClassEnrollmentSchema>;

// Schemas para Assessments (Avaliações)
export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentResultSchema = createInsertSchema(assessmentResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  gradedAt: true,
  submittedAt: true,
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = z.infer<typeof insertAssessmentResultSchema>;
