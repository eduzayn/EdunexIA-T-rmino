import { db } from '../server/db';
import * as schema from '../shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';

// Function to push schema to the database
async function pushSchema() {
  try {
    console.log('Conectando ao banco de dados...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const migrationDb = drizzle(pool);
    
    console.log('Criando tabelas se não existirem...');
    
    // Certifique-se de que todas as tabelas existam
    await migrationDb.execute(sql`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "domain" VARCHAR NOT NULL,
        "logo_url" VARCHAR,
        "primary_color" VARCHAR,
        "secondary_color" VARCHAR,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id"),
        "username" VARCHAR NOT NULL UNIQUE,
        "password" VARCHAR NOT NULL,
        "email" VARCHAR NOT NULL,
        "full_name" VARCHAR NOT NULL,
        "role" VARCHAR NOT NULL,
        "avatar_url" VARCHAR,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "courses" (
        "id" SERIAL PRIMARY KEY,
        "code" INTEGER NOT NULL,
        "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id"),
        "title" VARCHAR NOT NULL,
        "description" TEXT,
        "image_url" VARCHAR,
        "price" DECIMAL(10, 2),
        "teacher_id" INTEGER REFERENCES "users"("id"),
        "status" VARCHAR NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "modules" (
        "id" SERIAL PRIMARY KEY,
        "course_id" INTEGER NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "title" VARCHAR NOT NULL,
        "description" TEXT,
        "order" INTEGER NOT NULL,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "lessons" (
        "id" SERIAL PRIMARY KEY,
        "module_id" INTEGER NOT NULL REFERENCES "modules"("id") ON DELETE CASCADE,
        "title" VARCHAR NOT NULL,
        "description" TEXT,
        "content" TEXT,
        "video_url" VARCHAR,
        "order" INTEGER NOT NULL,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "subjects" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id"),
        "title" VARCHAR NOT NULL,
        "description" TEXT,
        "workload" INTEGER,
        "area" VARCHAR,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "enrollments" (
        "id" SERIAL PRIMARY KEY,
        "course_id" INTEGER NOT NULL REFERENCES "courses"("id"),
        "student_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "status" VARCHAR NOT NULL,
        "progress" INTEGER NOT NULL DEFAULT 0,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "lesson_progress" (
        "id" SERIAL PRIMARY KEY,
        "enrollment_id" INTEGER NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
        "lesson_id" INTEGER NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
        "status" VARCHAR NOT NULL,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" SERIAL PRIMARY KEY,
        "enrollment_id" INTEGER REFERENCES "enrollments"("id"),
        "status" VARCHAR NOT NULL,
        "amount" DECIMAL(10, 2) NOT NULL,
        "payment_method" VARCHAR,
        "payment_date" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "leads" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id"),
        "name" VARCHAR NOT NULL,
        "email" VARCHAR NOT NULL,
        "phone" VARCHAR,
        "status" VARCHAR NOT NULL,
        "source" VARCHAR,
        "course_interest" INTEGER REFERENCES "courses"("id"),
        "notes" TEXT,
        "assigned_to" INTEGER REFERENCES "users"("id"),
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "ai_knowledge_base" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id"),
        "title" VARCHAR NOT NULL,
        "content" TEXT NOT NULL,
        "vector_embedding" TEXT,
        "metadata" JSONB,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "productivity_logs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "activity_type" VARCHAR NOT NULL,
        "activity_data" JSONB,
        "duration" INTEGER,
        "created_at" TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "simplified_enrollments" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "course_id" INTEGER NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "student_id" INTEGER REFERENCES "users"("id"),
        "student_name" VARCHAR NOT NULL,
        "student_email" VARCHAR NOT NULL,
        "student_cpf" VARCHAR NOT NULL,
        "student_phone" VARCHAR,
        "polo_id" INTEGER REFERENCES "users"("id"),
        "consultant_id" INTEGER REFERENCES "users"("id"),
        "amount" INTEGER NOT NULL,
        "installments" INTEGER NOT NULL DEFAULT 1,
        "external_reference" VARCHAR,
        "payment_url" VARCHAR,
        "asaas_customer_id" VARCHAR,
        "asaas_payment_id" VARCHAR,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "expiration_date" TIMESTAMP,
        "source_channel" VARCHAR,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completed_at" TIMESTAMP,
        "cancelled_at" TIMESTAMP
      );
      
      CREATE TYPE "document_status" AS ENUM ('pending', 'approved', 'rejected');
      
      CREATE TABLE IF NOT EXISTS "document_types" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "code" VARCHAR NOT NULL,
        "name" VARCHAR NOT NULL,
        "description" TEXT,
        "is_required" BOOLEAN NOT NULL DEFAULT false,
        "category" VARCHAR NOT NULL DEFAULT 'personal',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("tenant_id", "code")
      );
      
      CREATE TABLE IF NOT EXISTS "student_documents" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "student_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "document_type_id" INTEGER REFERENCES "document_types"("id") ON DELETE RESTRICT,
        "title" VARCHAR NOT NULL,
        "description" TEXT,
        "file_path" VARCHAR NOT NULL,
        "file_name" VARCHAR NOT NULL,
        "file_size" INTEGER NOT NULL,
        "mime_type" VARCHAR NOT NULL,
        "upload_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" document_status NOT NULL DEFAULT 'pending',
        "comments" TEXT,
        "reviewed_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "reviewed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS "document_requests" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "student_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "document_type_id" INTEGER REFERENCES "document_types"("id") ON DELETE RESTRICT,
        "request_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "justification" TEXT,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "comments" TEXT,
        "generated_document_id" INTEGER REFERENCES "student_documents"("id") ON DELETE SET NULL,
        "reviewed_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "reviewed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Verificando indexes...');
    
    // Criar índices para melhorar a performance
    await migrationDb.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_users_tenant_id" ON "users" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "idx_courses_tenant_id" ON "courses" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "idx_modules_course_id" ON "modules" ("course_id");
      CREATE INDEX IF NOT EXISTS "idx_lessons_module_id" ON "lessons" ("module_id");
      CREATE INDEX IF NOT EXISTS "idx_subjects_tenant_id" ON "subjects" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "idx_enrollments_course_id" ON "enrollments" ("course_id");
      CREATE INDEX IF NOT EXISTS "idx_enrollments_student_id" ON "enrollments" ("student_id");
      CREATE INDEX IF NOT EXISTS "idx_lesson_progress_enrollment_id" ON "lesson_progress" ("enrollment_id");
      CREATE INDEX IF NOT EXISTS "idx_lesson_progress_lesson_id" ON "lesson_progress" ("lesson_id");
      CREATE INDEX IF NOT EXISTS "idx_payments_enrollment_id" ON "payments" ("enrollment_id");
      CREATE INDEX IF NOT EXISTS "idx_leads_tenant_id" ON "leads" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "idx_productivity_logs_user_id" ON "productivity_logs" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_simplified_enrollments_tenant_id" ON "simplified_enrollments" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "idx_simplified_enrollments_course_id" ON "simplified_enrollments" ("course_id");
      CREATE INDEX IF NOT EXISTS "idx_simplified_enrollments_status" ON "simplified_enrollments" ("status");
      
      -- Índices para tabelas de documentos
      CREATE INDEX IF NOT EXISTS "idx_document_types_tenant_id" ON "document_types" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "idx_document_types_category" ON "document_types" ("category");
      CREATE INDEX IF NOT EXISTS "idx_student_documents_tenant_id" ON "student_documents" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "idx_student_documents_student_id" ON "student_documents" ("student_id");
      CREATE INDEX IF NOT EXISTS "idx_student_documents_document_type_id" ON "student_documents" ("document_type_id");
      CREATE INDEX IF NOT EXISTS "idx_student_documents_status" ON "student_documents" ("status");
      CREATE INDEX IF NOT EXISTS "idx_document_requests_tenant_id" ON "document_requests" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "idx_document_requests_student_id" ON "document_requests" ("student_id");
      CREATE INDEX IF NOT EXISTS "idx_document_requests_document_type_id" ON "document_requests" ("document_type_id");
      CREATE INDEX IF NOT EXISTS "idx_document_requests_status" ON "document_requests" ("status");
    `);
    
    console.log('Schema atualizado com sucesso!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao atualizar schema:', error);
    process.exit(1);
  }
}

pushSchema();