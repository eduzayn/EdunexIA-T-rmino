import { 
  User, InsertUser,
  Tenant, InsertTenant,
  Course, InsertCourse,
  Enrollment, InsertEnrollment,
  Lead, InsertLead
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  users, tenants, courses, enrollments, leads, 
  lessons, lessonProgress, payments,
  aiKnowledgeBase, productivityLogs
} from "@shared/schema";
import { IStorage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário por nome de usuário:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        avatarUrl: userData.avatarUrl || null
      }).returning();
      return user;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  async getTenantById(id: number): Promise<Tenant | undefined> {
    try {
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
      return tenant;
    } catch (error) {
      console.error('Erro ao buscar tenant por ID:', error);
      return undefined;
    }
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    try {
      const [tenant] = await db.insert(tenants).values({
        ...tenantData,
        createdAt: new Date(),
        updatedAt: new Date(),
        logoUrl: tenantData.logoUrl || null,
        primaryColor: tenantData.primaryColor || null,
        secondaryColor: tenantData.secondaryColor || null
      }).returning();
      return tenant;
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
      throw error;
    }
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    try {
      const [course] = await db.select().from(courses).where(eq(courses.id, id));
      return course;
    } catch (error) {
      console.error('Erro ao buscar curso por ID:', error);
      return undefined;
    }
  }

  async getCoursesByTenant(tenantId: number): Promise<Course[]> {
    try {
      return await db.select().from(courses).where(eq(courses.tenantId, tenantId));
    } catch (error) {
      console.error('Erro ao buscar cursos por tenant:', error);
      return [];
    }
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    try {
      const [course] = await db.insert(courses).values({
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: courseData.description || null,
        imageUrl: courseData.imageUrl || null,
        price: courseData.price || null,
        teacherId: courseData.teacherId || null,
        status: courseData.status || "draft"
      }).returning();
      return course;
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      throw error;
    }
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    try {
      return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
    } catch (error) {
      console.error('Erro ao buscar matrículas por aluno:', error);
      return [];
    }
  }

  async getEnrollmentsByTeacher(teacherId: number): Promise<Enrollment[]> {
    try {
      // Busca cursos do professor
      const teacherCourses = await db.select().from(courses).where(eq(courses.teacherId, teacherId));
      const courseIds = teacherCourses.map(course => course.id);
      
      if (courseIds.length === 0) return [];
      
      // Busca matrículas nos cursos do professor
      return await db
        .select()
        .from(enrollments)
        .where(sql`${enrollments.courseId} IN (${sql.join(courseIds, sql`, `)})`);
    } catch (error) {
      console.error('Erro ao buscar matrículas por professor:', error);
      return [];
    }
  }

  async getEnrollmentsByTenant(tenantId: number): Promise<Enrollment[]> {
    try {
      // Busca cursos do tenant
      const tenantCourses = await db.select().from(courses).where(eq(courses.tenantId, tenantId));
      const courseIds = tenantCourses.map(course => course.id);
      
      if (courseIds.length === 0) return [];
      
      // Busca matrículas nos cursos do tenant
      return await db
        .select()
        .from(enrollments)
        .where(sql`${enrollments.courseId} IN (${sql.join(courseIds, sql`, `)})`);
    } catch (error) {
      console.error('Erro ao buscar matrículas por tenant:', error);
      return [];
    }
  }

  async createEnrollment(enrollmentData: InsertEnrollment): Promise<Enrollment> {
    try {
      const [enrollment] = await db.insert(enrollments).values({
        ...enrollmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        status: enrollmentData.status || "active",
        progress: enrollmentData.progress || 0
      }).returning();
      return enrollment;
    } catch (error) {
      console.error('Erro ao criar matrícula:', error);
      throw error;
    }
  }

  async getLeadsByTenant(tenantId: number): Promise<Lead[]> {
    try {
      return await db.select().from(leads).where(eq(leads.tenantId, tenantId));
    } catch (error) {
      console.error('Erro ao buscar leads por tenant:', error);
      return [];
    }
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    try {
      const [lead] = await db.insert(leads).values({
        ...leadData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: leadData.status || "new",
        source: leadData.source || null,
        phone: leadData.phone || null,
        courseInterest: leadData.courseInterest || null,
        notes: leadData.notes || null,
        assignedTo: leadData.assignedTo || null
      }).returning();
      return lead;
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      throw error;
    }
  }

  async getDashboardStats(tenantId: number): Promise<any> {
    try {
      const studentsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          eq(users.role, "student")
        ));
        
      const coursesCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(courses)
        .where(eq(courses.tenantId, tenantId));
        
      const activeEnrollmentsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .where(sql`${enrollments.courseId} IN (
          SELECT id FROM ${courses} WHERE tenant_id = ${tenantId}
        ) AND ${enrollments.status} = 'active'`);

      const leadsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(eq(leads.tenantId, tenantId));
      
      // Simplificando a consulta de receita para evitar problemas com as junções complexas
      const revenueResult = await db
        .select({ total: sql<number>`SUM(p.amount)` })
        .from(sql`${payments} p`)
        .where(sql`p.tenant_id = ${tenantId}`);
      
      // Últimas matrículas
      const recentEnrollments = await db
        .select({
          id: enrollments.id,
          createdAt: enrollments.createdAt,
          status: enrollments.status,
          studentId: enrollments.studentId,
          courseId: enrollments.courseId,
        })
        .from(enrollments)
        .where(sql`${enrollments.courseId} IN (
          SELECT id FROM ${courses} WHERE tenant_id = ${tenantId}
        )`)
        .orderBy(desc(enrollments.createdAt))
        .limit(5);
      
      // Últimos leads
      const recentLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.tenantId, tenantId))
        .orderBy(desc(leads.createdAt))
        .limit(5);
      
      // Versão simplificada de cursos populares para evitar problemas de sintaxe
      const popularCourses = await db
        .select({
          courseId: courses.id,
          courseTitle: courses.title
        })
        .from(courses)
        .where(eq(courses.tenantId, tenantId))
        .limit(5);
      
      return {
        studentsCount: studentsCount[0]?.count || 0,
        coursesCount: coursesCount[0]?.count || 0,
        activeEnrollmentsCount: activeEnrollmentsCount[0]?.count || 0,
        leadsCount: leadsCount[0]?.count || 0,
        revenue: revenueResult[0]?.total || 0,
        recentEnrollments,
        recentLeads,
        popularCourses
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      return {
        studentsCount: 0,
        coursesCount: 0,
        activeEnrollmentsCount: 0,
        leadsCount: 0,
        revenue: 0,
        recentEnrollments: [],
        recentLeads: [],
        popularCourses: []
      };
    }
  }
}