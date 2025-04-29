import { 
  User, InsertUser,
  Tenant, InsertTenant,
  Course, InsertCourse,
  Module, InsertModule,
  Lesson, InsertLesson,
  Enrollment, InsertEnrollment,
  Lead, InsertLead,
  Subject, InsertSubject
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  users, tenants, courses, modules, lessons, enrollments, leads, 
  lessonProgress, payments,
  aiKnowledgeBase, productivityLogs
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tenant operations
  getTenantById(id: number): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Course operations
  getCourseById(id: number): Promise<Course | undefined>;
  getCoursesByTenant(tenantId: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course>;
  
  // Subject operations
  getSubjectById(id: number): Promise<Subject | undefined>;
  getSubjectsByTenant(tenantId: number): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subjectData: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: number): Promise<boolean>;
  
  // Module operations
  getModulesByCourse(courseId: number): Promise<Module[]>;
  getModuleById(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, moduleData: Partial<InsertModule>): Promise<Module>;
  deleteModule(id: number): Promise<boolean>;
  
  // Enrollment operations
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByTeacher(teacherId: number): Promise<Enrollment[]>;
  getEnrollmentsByTenant(tenantId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  
  // Lead operations
  getLeadsByTenant(tenantId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  
  // Dashboard statistics
  getDashboardStats(tenantId: number): Promise<any>;
  
  // Session store
  sessionStore: session.Store;
}

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

  // Gera um código único para o curso dentro de um tenant
  private async generateUniqueCourseCode(tenantId: number): Promise<number> {
    try {
      // Buscar o maior código de curso existente para o tenant
      const result = await db
        .select({ maxCode: sql`MAX(${courses.code})` })
        .from(courses)
        .where(eq(courses.tenantId, tenantId));
      
      // Garantir que o valor é do tipo number
      let maxCode = 0;
      if (result[0]?.maxCode) {
        maxCode = Number(result[0].maxCode);
      }
      // Incrementar o código máximo atual ou começar do 1000 se for o primeiro curso
      return maxCode > 0 ? maxCode + 1 : 1000;
    } catch (error) {
      console.error('Erro ao gerar código único para curso:', error);
      // Fallback para um código aleatório entre 1000 e 9999 em caso de erro
      return 1000 + Math.floor(Math.random() * 9000);
    }
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    try {
      // Gerar um código único para o curso
      const courseCode = await this.generateUniqueCourseCode(courseData.tenantId);
      
      const [course] = await db.insert(courses).values({
        ...courseData,
        code: courseCode,
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
  
  // Subject operations
  async getSubjectById(id: number): Promise<Subject | undefined> {
    try {
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
      return subject;
    } catch (error) {
      console.error('Erro ao buscar disciplina por ID:', error);
      return undefined;
    }
  }

  async getSubjectsByTenant(tenantId: number): Promise<Subject[]> {
    try {
      return await db.select().from(subjects).where(eq(subjects.tenantId, tenantId))
        .orderBy(subjects.title);
    } catch (error) {
      console.error('Erro ao buscar disciplinas por tenant:', error);
      return [];
    }
  }

  async createSubject(subjectData: InsertSubject): Promise<Subject> {
    try {
      const [subject] = await db.insert(subjects).values({
        ...subjectData,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: subjectData.description || null,
        workload: subjectData.workload || null,
        area: subjectData.area || null,
        isActive: subjectData.isActive !== undefined ? subjectData.isActive : true
      }).returning();
      return subject;
    } catch (error) {
      console.error('Erro ao criar disciplina:', error);
      throw error;
    }
  }

  async updateSubject(id: number, subjectData: Partial<InsertSubject>): Promise<Subject> {
    try {
      const [updatedSubject] = await db.update(subjects)
        .set({
          ...subjectData,
          updatedAt: new Date()
        })
        .where(eq(subjects.id, id))
        .returning();
      
      if (!updatedSubject) {
        throw new Error('Disciplina não encontrada');
      }
      
      return updatedSubject;
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
      throw error;
    }
  }

  async deleteSubject(id: number): Promise<boolean> {
    try {
      const result = await db.delete(subjects).where(eq(subjects.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
      return false;
    }
  }
  
  async updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course> {
    try {
      const [updatedCourse] = await db.update(courses)
        .set({
          ...courseData,
          updatedAt: new Date()
        })
        .where(eq(courses.id, id))
        .returning();
      
      if (!updatedCourse) {
        throw new Error('Curso não encontrado');
      }
      
      return updatedCourse;
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      throw error;
    }
  }
  
  async getModulesByCourse(courseId: number): Promise<Module[]> {
    try {
      // Buscar módulos do curso
      const courseModules = await db
        .select({
          id: modules.id,
          title: modules.title,
          description: modules.description,
          order: modules.order,
          courseId: modules.courseId,
          createdAt: modules.createdAt,
          updatedAt: modules.updatedAt
        })
        .from(modules)
        .where(eq(modules.courseId, courseId))
        .orderBy(modules.order);
      
      // Para cada módulo, buscar suas aulas
      const modulesWithLessons = await Promise.all(
        courseModules.map(async (module) => {
          const moduleLessons = await db
            .select({
              id: lessons.id,
              title: lessons.title,
              description: lessons.description,
              content: lessons.content,
              videoUrl: lessons.videoUrl,
              order: lessons.order,
              moduleId: lessons.moduleId,
              createdAt: lessons.createdAt,
              updatedAt: lessons.updatedAt
            })
            .from(lessons)
            .where(eq(lessons.moduleId, module.id))
            .orderBy(lessons.order);
          
          return {
            ...module,
            lessons: moduleLessons
          };
        })
      );
      
      return modulesWithLessons as Module[];
    } catch (error) {
      console.error('Erro ao buscar módulos por curso:', error);
      return [];
    }
  }
  
  async getModuleById(id: number): Promise<Module | undefined> {
    try {
      const [module] = await db.select().from(modules).where(eq(modules.id, id));
      
      if (module) {
        // Buscar aulas do módulo
        const moduleLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.moduleId, module.id))
          .orderBy(lessons.order);
        
        return {
          ...module,
          lessons: moduleLessons
        } as Module;
      }
      
      return module;
    } catch (error) {
      console.error('Erro ao buscar módulo por ID:', error);
      return undefined;
    }
  }

  async createModule(moduleData: InsertModule): Promise<Module> {
    try {
      // Verificar a ordem mais alta atual para os módulos deste curso
      const result = await db
        .select({ maxOrder: sql`MAX(${modules.order})` })
        .from(modules)
        .where(eq(modules.courseId, moduleData.courseId));
      
      // Definir a ordem como a próxima disponível
      let nextOrder = 1;
      if (result[0]?.maxOrder) {
        nextOrder = Number(result[0].maxOrder) + 1;
      }
      
      const [newModule] = await db.insert(modules).values({
        ...moduleData,
        order: moduleData.order || nextOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: moduleData.description || null
      }).returning();
      
      return newModule;
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
      throw error;
    }
  }
  
  async updateModule(id: number, moduleData: Partial<InsertModule>): Promise<Module> {
    try {
      const [updatedModule] = await db.update(modules)
        .set({
          ...moduleData,
          updatedAt: new Date()
        })
        .where(eq(modules.id, id))
        .returning();
      
      if (!updatedModule) {
        throw new Error('Módulo não encontrado');
      }
      
      return updatedModule;
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      throw error;
    }
  }
  
  async deleteModule(id: number): Promise<boolean> {
    try {
      // Primeiro exclui aulas relacionadas ao módulo
      await db.delete(lessons).where(eq(lessons.moduleId, id));
      
      // Depois exclui o módulo
      const result = await db.delete(modules).where(eq(modules.id, id)).returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
      return false;
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

// Exportando a instância da DatabaseStorage para uso em toda a aplicação
export const storage = new DatabaseStorage();