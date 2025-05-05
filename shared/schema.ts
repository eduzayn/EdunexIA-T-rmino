import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, uuid, json, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

export const simplifiedEnrollmentStatusEnum = pgEnum('simplified_enrollment_status', [
  'pending', 'waiting_payment', 'payment_confirmed', 'completed', 'cancelled', 'failed'
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new', 'contacted', 'qualified', 'converted', 'lost'
]);

export const opportunityStatusEnum = pgEnum('opportunity_status', [
  'open', 'negotiation', 'won', 'lost', 'cancelled'
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
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
  code: text('code').notNull(), // Código único da disciplina
  title: text('title').notNull(),
  description: text('description'),
  workload: integer('workload'), // Carga horária em horas
  area: text('area'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    codeUnique: unique().on(table.code, table.tenantId), // Garantir que o código é único por tenant
  };
});

// Relação entre cursos e disciplinas (many-to-many)
export const courseSubjects = pgTable('course_subjects', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  order: integer('order').notNull(), // Ordem da disciplina no curso
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    uniqueCourseSubject: unique().on(table.courseId, table.subjectId), // Cada disciplina só pode estar uma vez em um curso
  };
});

// Modules (Sections of a subject)
export const modules = pgTable('modules', {
  id: serial('id').primaryKey(),
  subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tipo de conteúdo para materiais
export const materialTypeEnum = pgEnum('material_type', [
  'video', // Vídeo aula
  'ebook', // E-book ou material de leitura
  'pdf', // Documento PDF
  'link', // Link externo
  'scorm', // Pacote SCORM
  'quiz', // Questionário/simulado
  'assessment' // Avaliação
]);

// Removido pois estava duplicado com videoProviderEnum

// Tipo de questão
export const questionTypeEnum = pgEnum('question_type', [
  'multiple_choice', // Múltipla escolha
  'true_false', // Verdadeiro ou falso
  'short_answer', // Resposta curta
  'essay', // Dissertativa
  'matching' // Correspondência
]);

// Tipo de provedor de vídeo
export const videoProviderEnum = pgEnum('video_provider', [
  'youtube',
  'vimeo',
  'google_drive',
  'other'
]);

// Lessons (Video Aulas e outros materiais didáticos)
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => modules.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  content: text('content'),
  materialType: materialTypeEnum('material_type').default('video').notNull(),
  // Campos para vídeos
  videoUrl: text('video_url'),
  videoProvider: videoProviderEnum('video_provider'),
  videoId: text('video_id'), // ID do vídeo no provedor (ex: ID do YouTube)
  // Campos para materiais de leitura
  fileUrl: text('file_url'), // URL para e-books, PDFs ou SCORMs
  fileType: text('file_type'), // Tipo de arquivo (PDF, DOCX, etc.)
  fileSize: integer('file_size'), // Tamanho do arquivo em bytes
  // Campos comuns
  isRequired: boolean('is_required').default(true).notNull(), // Se o material é obrigatório para conclusão
  duration: integer('duration'), // Duração em minutos (para vídeos) ou tempo estimado de leitura
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

// Opportunities (CRM)
export const opportunities = pgTable('opportunities', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  leadId: integer('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  courseId: integer('course_id').references(() => courses.id),
  value: integer('value'), // in cents
  predictedClosingDate: timestamp('predicted_closing_date'),
  status: opportunityStatusEnum('status').default('open').notNull(),
  assignedTo: integer('assigned_to').references(() => users.id),
  probability: integer('probability').default(50), // percentage 0-100
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
});

// Campaigns (Marketing)
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // email, sms, whatsapp, social_media
  courseId: integer('course_id').references(() => courses.id),
  budget: integer('budget'), // in cents
  status: campaignStatusEnum('status').default('draft').notNull(),
  audience: json('audience'), // target audience criteria
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// AI Knowledge Base
export const aiKnowledgeBase = pgTable('ai_knowledge_base', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('general'),
  fileUrl: text('file_url'),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Settings
export const aiSettings = pgTable('ai_settings', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  assistantName: text('assistant_name').default('Prof. Ana').notNull(),
  defaultModel: text('default_model').default('claude-3-7-sonnet-20250219').notNull(),
  maxTokensPerRequest: integer('max_tokens_per_request').default(2048).notNull(),
  enabledFeatures: json('enabled_features').default(['chat', 'contentGeneration', 'textAnalysis', 'imageAnalysis']),
  customInstructions: text('custom_instructions').default('Atue como uma assistente educacional focada no contexto brasileiro.'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Conversation History
export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').default('Nova conversa'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Conversation Messages
export const aiMessages = pgTable('ai_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => aiConversations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user' ou 'assistant'
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// AI Generated Content
export const aiGeneratedContent = pgTable('ai_generated_content', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  contentType: text('content_type').notNull(), // 'lesson-plan', 'exercise', 'assessment', etc.
  parameters: json('parameters'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Simulados (Quizzes)
export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => modules.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  instructions: text('instructions'),
  timeLimit: integer('time_limit'), // Tempo limite em minutos
  passingScore: integer('passing_score').default(70), // Pontuação mínima para aprovação (%)
  isRequired: boolean('is_required').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  allowRetake: boolean('allow_retake').default(true), // Permite refazer o simulado
  maxAttempts: integer('max_attempts'), // Número máximo de tentativas permitidas
  shuffleQuestions: boolean('shuffle_questions').default(false), // Embaralhar a ordem das questões
  showAnswers: boolean('show_answers').default(true), // Mostrar respostas corretas após a conclusão
  quizType: text('quiz_type').default('practice').notNull(), // "practice" (simulado) ou "final" (avaliação final)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Questões para simulados e avaliações
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  questionText: text('question_text').notNull(),
  questionType: questionTypeEnum('question_type').default('multiple_choice').notNull(),
  options: json('options'), // Para questões de múltipla escolha: [{text: "Opção 1", correct: true}, ...]
  correctAnswer: text('correct_answer'), // Para questões de resposta curta, verdadeiro/falso
  explanation: text('explanation'), // Explicação da resposta correta
  points: integer('points').default(10).notNull(), // Pontos para esta questão
  difficultyLevel: integer('difficulty_level').default(2), // 1-5, onde 5 é o mais difícil
  tags: text('tags').array(), // Tags para categorizar questões
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tentativas de simulados e avaliações pelos alunos
export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  enrollmentId: integer('enrollment_id').references(() => enrollments.id, { onDelete: 'cascade' }).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  score: integer('score'), // Pontuação obtida
  percentageScore: integer('percentage_score'), // Pontuação em percentual
  timeSpent: integer('time_spent'), // Tempo gasto em segundos
  isPassed: boolean('is_passed'), // Se o aluno atingiu a pontuação mínima
  status: text('status').default('in_progress').notNull(), // 'in_progress', 'completed', 'abandoned'
  answers: json('answers'), // Respostas dadas pelo aluno: [{questionId: 1, answer: "A", correct: true}, ...]
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    uniqueAttempt: unique().on(table.quizId, table.studentId, table.startedAt),
  };
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

// Matrículas Simplificadas
export const simplifiedEnrollments = pgTable('simplified_enrollments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  // Dados do aluno (pode não estar cadastrado ainda)
  studentId: integer('student_id').references(() => users.id), // Será preenchido quando o aluno for criado
  studentName: text('student_name').notNull(),
  studentEmail: text('student_email').notNull(),
  studentCpf: text('student_cpf').notNull(),
  studentPhone: text('student_phone'),
  // Dados adicionais
  poloId: integer('polo_id').references(() => users.id), // Referência ao polo educacional
  consultantId: integer('consultant_id').references(() => users.id), // Quem fez a matrícula
  // Dados financeiros
  amount: integer('amount').notNull(), // em centavos
  installments: integer('installments').default(1).notNull(), // número de parcelas
  paymentMethod: text('payment_method').default('BOLETO'), // BOLETO, CREDIT_CARD, PIX
  // Referências externas
  externalReference: text('external_reference'), // ID de referência externa para rastreamento
  paymentUrl: text('payment_url'), // URL do checkout do Asaas
  asaasCustomerId: text('asaas_customer_id'), // ID do cliente no Asaas
  asaasPaymentId: text('asaas_payment_id'), // ID do pagamento no Asaas
  // Status e datas
  status: simplifiedEnrollmentStatusEnum('status').default('pending').notNull(),
  expirationDate: timestamp('expiration_date'), // Data limite para pagamento
  sourceChannel: text('source_channel'), // Canal de origem (site, indicação, etc.)
  // Campos de auditoria
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
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

// Schemas para Opportunities (Oportunidades)
export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
});

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;

// Schemas para Campaigns (Campanhas)
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

// Esquemas e Tipos para Módulos e Aulas
export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Definir relações entre tabelas
export const subjectsRelations = relations(subjects, ({ many }) => ({
  modules: many(modules),
  courseSubjects: many(courseSubjects),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  courseSubjects: many(courseSubjects),
}));

export const modulesRelations = relations(modules, ({ one }) => ({
  subject: one(subjects, {
    fields: [modules.subjectId],
    references: [subjects.id],
  }),
}));

export const courseSubjectsRelations = relations(courseSubjects, ({ one }) => ({
  course: one(courses, {
    fields: [courseSubjects.courseId],
    references: [courses.id],
  }),
  subject: one(subjects, {
    fields: [courseSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

// Schema para Subjects (Disciplinas)
export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  code: true, // Removemos code para que seja gerado automaticamente no servidor
}).extend({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  code: z.string().min(2, "O código deve ter pelo menos 2 caracteres").optional(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

// Schema para Course-Subjects (Relacionamento Curso-Disciplina)
export const insertCourseSubjectSchema = createInsertSchema(courseSubjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CourseSubject = typeof courseSubjects.$inferSelect;
export type InsertCourseSubject = z.infer<typeof insertCourseSubjectSchema>;

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

// Schemas para simulados e avaliações
export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  completedAt: true
});

// Types para simulados e avaliações
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// Schema para Matrícula Simplificada
export const insertSimplifiedEnrollmentSchema = createInsertSchema(simplifiedEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  cancelledAt: true,
  studentId: true, // Será preenchido durante o processamento
  asaasCustomerId: true, // Será preenchido durante o processamento
  asaasPaymentId: true, // Será preenchido durante o processamento
  paymentUrl: true, // Será preenchido durante o processamento
  externalReference: true, // Será preenchido durante o processamento
});

export type SimplifiedEnrollment = typeof simplifiedEnrollments.$inferSelect;
export type InsertSimplifiedEnrollment = z.infer<typeof insertSimplifiedEnrollmentSchema>;

// Enum para o status dos contratos educacionais
export const contractStatusEnum = pgEnum('contract_status', [
  'pending', 'signed', 'expired', 'cancelled'
]);

// Contratos Educacionais
export const educationalContracts = pgTable('educational_contracts', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  studentId: integer('student_id').notNull().references(() => users.id),
  enrollmentId: integer('enrollment_id').references(() => enrollments.id),
  simplifiedEnrollmentId: integer('simplified_enrollment_id').references(() => simplifiedEnrollments.id),
  courseId: integer('course_id').notNull().references(() => courses.id),
  
  // Informações contratuais
  contractNumber: text('contract_number').notNull().unique(),
  contractVersion: text('contract_version').default('1.0').notNull(),
  contractText: text('contract_text').notNull(),
  status: text('status').default('pending').notNull(),
  
  // Informações financeiras
  totalValue: integer('total_value').notNull(), // em centavos
  installments: integer('installments').default(1).notNull(),
  installmentValue: integer('installment_value').notNull(), // em centavos
  
  // Datas importantes
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  signedAt: timestamp('signed_at'),
  
  // URL e armazenamento
  contractUrl: text('contract_url'), // URL para o PDF do contrato
  signatureUrl: text('signature_url'), // URL para assinatura (se for eletrônica)
  
  // Metadados
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schema para Contratos Educacionais
export const insertEducationalContractSchema = createInsertSchema(educationalContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  signedAt: true,
  generatedAt: true,
  contractNumber: true, // Será gerado automaticamente 
});

export type EducationalContract = typeof educationalContracts.$inferSelect;
export type InsertEducationalContract = z.infer<typeof insertEducationalContractSchema>;

// Enum para o status dos documentos
export const documentStatusEnum = pgEnum('document_status', [
  'pending', 'approved', 'rejected'
]);

// Tipos de Documentos
export const documentTypes = pgTable('document_types', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isRequired: boolean('is_required').default(false).notNull(),
  category: text('category').default('personal').notNull(), // personal, academic, financial, etc.
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    codeUnique: unique().on(table.code, table.tenantId), // garantir que o código é único por tenant
  };
});

// Documentos dos Alunos
export const studentDocuments = pgTable('student_documents', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  documentTypeId: integer('document_type_id').references(() => documentTypes.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  description: text('description'),
  filePath: text('file_path').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(), // tamanho em bytes
  mimeType: text('mime_type').notNull(),
  uploadDate: timestamp('upload_date').defaultNow().notNull(),
  status: documentStatusEnum('status').default('pending').notNull(),
  comments: text('comments'),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Solicitações de Documentos
export const documentRequests = pgTable('document_requests', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  documentTypeId: integer('document_type_id').references(() => documentTypes.id, { onDelete: 'restrict' }),
  requestDate: timestamp('request_date').defaultNow().notNull(),
  justification: text('justification'),
  status: text('status').default('pending').notNull(), // pending, processing, completed, rejected
  comments: text('comments'),
  generatedDocumentId: integer('generated_document_id').references(() => studentDocuments.id, { onDelete: 'set null' }),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schemas para Documentos
export const insertDocumentTypeSchema = createInsertSchema(documentTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentDocumentSchema = createInsertSchema(studentDocuments).omit({
  id: true,
  uploadDate: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentRequestSchema = createInsertSchema(documentRequests).omit({
  id: true,
  requestDate: true,
  reviewedAt: true,
  reviewedBy: true,
  generatedDocumentId: true,
  createdAt: true,
  updatedAt: true,
});

export type DocumentType = typeof documentTypes.$inferSelect;
export type InsertDocumentType = z.infer<typeof insertDocumentTypeSchema>;

export type StudentDocument = typeof studentDocuments.$inferSelect;
export type InsertStudentDocument = z.infer<typeof insertStudentDocumentSchema>;

export type DocumentRequest = typeof documentRequests.$inferSelect;
export type InsertDocumentRequest = z.infer<typeof insertDocumentRequestSchema>;

// Schemas para AI Knowledge Base
export const insertAiKnowledgeBaseSchema = createInsertSchema(aiKnowledgeBase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AiKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
export type InsertAiKnowledgeBase = z.infer<typeof insertAiKnowledgeBaseSchema>;

// Schemas para AI Settings
export const insertAiSettingsSchema = createInsertSchema(aiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AiSettings = typeof aiSettings.$inferSelect;
export type InsertAiSettings = z.infer<typeof insertAiSettingsSchema>;

// Schemas para AI Conversations
export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;

// Schemas para AI Messages
export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  timestamp: true,
});

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;

// Schemas para AI Generated Content
export const insertAiGeneratedContentSchema = createInsertSchema(aiGeneratedContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AiGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type InsertAiGeneratedContent = z.infer<typeof insertAiGeneratedContentSchema>;

// Library Materials
export const libraryMaterialTypeEnum = pgEnum('library_material_type', [
  'ebook', 'article', 'video', 'link', 'document', 'other'
]);

export const libraryMaterials = pgTable('library_materials', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: libraryMaterialTypeEnum('type').notNull(),
  url: text('url'),
  fileUrl: text('file_url'),
  fileSize: integer('file_size'),
  author: text('author'),
  publisher: text('publisher'),
  publicationDate: timestamp('publication_date'),
  coverImageUrl: text('cover_image_url'),
  tags: text('tags').array(),
  isPublic: boolean('is_public').default(true).notNull(),
  metadata: json('metadata'),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages
export const messageStatusEnum = pgEnum('message_status', [
  'unread', 'read', 'archived', 'deleted'
]);

export const userMessages = pgTable('user_messages', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'set null' }),
  recipientId: integer('recipient_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  subject: text('subject').notNull(),
  content: text('content').notNull(),
  status: messageStatusEnum('status').default('unread').notNull(),
  threadId: integer('thread_id'), // Para agrupar conversas relacionadas
  attachmentUrl: text('attachment_url'),
  attachmentName: text('attachment_name'),
  attachmentSize: integer('attachment_size'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
});

// User Settings
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  theme: text('theme').default('system'),
  language: text('language').default('pt-BR'),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  smsNotifications: boolean('sms_notifications').default(true).notNull(),
  pushNotifications: boolean('push_notifications').default(true).notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  timezone: text('timezone').default('America/Sao_Paulo'),
  dateFormat: text('date_format'),
  timeFormat: text('time_format'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdUnique: unique().on(table.userId),
  };
});

// System Settings
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  maintenanceMode: boolean('maintenance_mode').default(false).notNull(),
  maintenanceMessage: text('maintenance_message'),
  theme: text('theme').default('light'),
  defaultDateFormat: text('default_date_format').default('DD/MM/YYYY'),
  defaultTimeFormat: text('default_time_format').default('HH:mm'),
  timezone: text('timezone').default('America/Sao_Paulo'),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  emailNotificationsEnabled: boolean('email_notifications_enabled').default(true).notNull(),
  smsNotificationsEnabled: boolean('sms_notifications_enabled').default(true).notNull(),
  customCss: text('custom_css'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schemas for System Settings
export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schemas for Library Materials
export const insertLibraryMaterialSchema = createInsertSchema(libraryMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LibraryMaterial = typeof libraryMaterials.$inferSelect;
export type InsertLibraryMaterial = z.infer<typeof insertLibraryMaterialSchema>;

// Schemas for Messages
export const insertMessageSchema = createInsertSchema(userMessages).omit({
  id: true,
  status: true,
  sentAt: true,
  readAt: true,
});

export type Message = typeof userMessages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Schemas for User Settings
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
