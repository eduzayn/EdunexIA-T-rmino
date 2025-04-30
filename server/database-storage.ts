import { 
  User, InsertUser,
  Tenant, InsertTenant,
  Course, InsertCourse,
  Module, InsertModule,
  Lesson, InsertLesson,
  Enrollment, InsertEnrollment,
  Lead, InsertLead,
  Subject, InsertSubject,
  Class, InsertClass,
  ClassEnrollment, InsertClassEnrollment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  users, tenants, courses, modules, lessons, enrollments, leads, subjects,
  lessonProgress, payments, classes, classEnrollments,
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
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  
  // Student operations (usuários com role='student')
  getStudentsByTenant(tenantId: number): Promise<User[]>;
  getStudentById(id: number): Promise<User | undefined>;
  
  // Teacher operations (usuários com role='teacher')
  getTeachersByTenant(tenantId: number): Promise<User[]>;
  getTeacherById(id: number): Promise<User | undefined>;
  
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
  
  // Class operations (Turmas)
  getClassById(id: number): Promise<Class | undefined>;
  getClassesByTenant(tenantId: number): Promise<Class[]>;
  getClassesBySubject(subjectId: number): Promise<Class[]>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: number): Promise<boolean>;
  
  // Class Enrollment operations (Matrículas em Turmas)
  getClassEnrollmentsByClass(classId: number): Promise<ClassEnrollment[]>;
  getClassEnrollmentsByStudent(studentId: number): Promise<ClassEnrollment[]>;
  createClassEnrollment(enrollment: InsertClassEnrollment): Promise<ClassEnrollment>;
  updateClassEnrollment(id: number, enrollmentData: Partial<InsertClassEnrollment>): Promise<ClassEnrollment>;
  deleteClassEnrollment(id: number): Promise<boolean>;
  
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
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        throw new Error('Usuário não encontrado');
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return false;
    }
  }
  
  async getStudentsByTenant(tenantId: number): Promise<User[]> {
    try {
      return await db.select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.role, 'student')
          )
        )
        .orderBy(users.fullName);
    } catch (error) {
      console.error('Erro ao buscar alunos por tenant:', error);
      return [];
    }
  }
  
  async getStudentById(id: number): Promise<User | undefined> {
    try {
      const [student] = await db.select()
        .from(users)
        .where(
          and(
            eq(users.id, id),
            eq(users.role, 'student')
          )
        );
      return student;
    } catch (error) {
      console.error('Erro ao buscar aluno por ID:', error);
      return undefined;
    }
  }
  
  async getTeachersByTenant(tenantId: number): Promise<User[]> {
    try {
      return await db.select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.role, 'teacher')
          )
        )
        .orderBy(users.fullName);
    } catch (error) {
      console.error('Erro ao buscar professores por tenant:', error);
      return [];
    }
  }
  
  async getTeacherById(id: number): Promise<User | undefined> {
    try {
      const [teacher] = await db.select()
        .from(users)
        .where(
          and(
            eq(users.id, id),
            eq(users.role, 'teacher')
          )
        );
      return teacher;
    } catch (error) {
      console.error('Erro ao buscar professor por ID:', error);
      return undefined;
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
      // Vamos verificar o schema atual da tabela subjects para usar somente os campos existentes
      const [subject] = await db.insert(subjects).values({
        tenantId: subjectData.tenantId,
        title: subjectData.title,
        description: subjectData.description || null,
        workload: subjectData.workload || null,
        area: subjectData.area || null,
        isActive: subjectData.isActive !== undefined ? subjectData.isActive : true,
        // Usamos os nomes corretos das colunas conforme definido no schema.ts
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return subject;
    } catch (error) {
      console.error('Erro ao criar disciplina:', error);
      throw error;
    }
  }

  async updateSubject(id: number, subjectData: Partial<InsertSubject>): Promise<Subject> {
    try {
      // Ajustamos para usar os campos específicos sem dependência de updatedAt
      const updateValues: any = {};
      
      if (subjectData.title !== undefined) updateValues.title = subjectData.title;
      if (subjectData.description !== undefined) updateValues.description = subjectData.description;
      if (subjectData.workload !== undefined) updateValues.workload = subjectData.workload;
      if (subjectData.area !== undefined) updateValues.area = subjectData.area;
      if (subjectData.isActive !== undefined) updateValues.isActive = subjectData.isActive;
      
      // Adicionamos um timestamp para updatedAt
      updateValues.updatedAt = new Date();
      
      const [updatedSubject] = await db.update(subjects)
        .set(updateValues)
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
  
  // Implementação dos métodos para Classes (Turmas)
  async getClassById(id: number): Promise<Class | undefined> {
    try {
      const [classItem] = await db.select().from(classes).where(eq(classes.id, id));
      return classItem;
    } catch (error) {
      console.error('Erro ao buscar turma por ID:', error);
      return undefined;
    }
  }

  async getClassesByTenant(tenantId: number): Promise<Class[]> {
    try {
      return await db.select().from(classes)
        .where(eq(classes.tenantId, tenantId))
        .orderBy(classes.name);
    } catch (error) {
      console.error('Erro ao buscar turmas por tenant:', error);
      return [];
    }
  }

  async getClassesBySubject(subjectId: number): Promise<Class[]> {
    try {
      return await db.select().from(classes)
        .where(eq(classes.subjectId, subjectId))
        .orderBy(classes.name);
    } catch (error) {
      console.error('Erro ao buscar turmas por disciplina:', error);
      return [];
    }
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    try {
      return await db.select().from(classes)
        .where(eq(classes.teacherId, teacherId))
        .orderBy(classes.name);
    } catch (error) {
      console.error('Erro ao buscar turmas por professor:', error);
      return [];
    }
  }

  // Gera um código único para a turma dentro de um tenant
  private async generateUniqueClassCode(tenantId: number, subjectId: number): Promise<string> {
    try {
      // Buscar a disciplina para usar seu título como base para o código
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, subjectId));
      
      // Pegar as duas primeiras letras do título da disciplina (ou 'XX' se não existir)
      const prefix = subject?.title ? subject.title.slice(0, 2).toUpperCase() : 'XX';
      
      // Buscar o maior número de sequência para esse prefixo
      const result = await db
        .select({ maxCode: sql`MAX(${classes.code})` })
        .from(classes)
        .where(and(
          eq(classes.tenantId, tenantId),
          sql`${classes.code} LIKE ${prefix + '%'}`
        ));
      
      let maxSequence = 0;
      if (result[0]?.maxCode) {
        // Extrair o número da sequência do código (assumindo formato XX-001)
        const match = result[0].maxCode.match(/\d+$/);
        if (match) {
          maxSequence = parseInt(match[0], 10);
        }
      }
      
      // Incrementar a sequência e formatá-la com zeros à esquerda
      const nextSequence = maxSequence + 1;
      const sequenceFormatted = nextSequence.toString().padStart(3, '0');
      
      // Retornar o código no formato XX-001
      return `${prefix}-${sequenceFormatted}`;
    } catch (error) {
      console.error('Erro ao gerar código único para turma:', error);
      // Fallback para um código aleatório
      const randomCode = Math.floor(Math.random() * 999).toString().padStart(3, '0');
      return `XX-${randomCode}`;
    }
  }

  async createClass(classData: InsertClass): Promise<Class> {
    try {
      // Gerar um código único para a turma se não for fornecido
      const classCode = classData.code || await this.generateUniqueClassCode(classData.tenantId, classData.subjectId);
      
      const [newClass] = await db.insert(classes).values({
        ...classData,
        code: classCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: classData.description || null,
        startDate: classData.startDate || null,
        endDate: classData.endDate || null,
        maxStudents: classData.maxStudents || null,
        teacherId: classData.teacherId || null,
        location: classData.location || null,
        scheduleInfo: classData.scheduleInfo || null,
        status: classData.status || "scheduled",
        isActive: classData.isActive !== undefined ? classData.isActive : true
      }).returning();
      
      return newClass;
    } catch (error) {
      console.error('Erro ao criar turma:', error);
      throw error;
    }
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class> {
    try {
      const updateValues: any = { ...classData, updatedAt: new Date() };
      
      const [updatedClass] = await db.update(classes)
        .set(updateValues)
        .where(eq(classes.id, id))
        .returning();
      
      if (!updatedClass) {
        throw new Error('Turma não encontrada');
      }
      
      return updatedClass;
    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
      throw error;
    }
  }

  async deleteClass(id: number): Promise<boolean> {
    try {
      // Primeiro excluir as matrículas relacionadas à turma
      await db.delete(classEnrollments).where(eq(classEnrollments.classId, id));
      
      // Depois excluir a turma
      const result = await db.delete(classes).where(eq(classes.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
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
  
  // Implementação dos métodos para Class Enrollments (Matrículas em Turmas)
  async getClassEnrollmentsByClass(classId: number): Promise<ClassEnrollment[]> {
    try {
      return await db.select().from(classEnrollments)
        .where(eq(classEnrollments.classId, classId));
    } catch (error) {
      console.error('Erro ao buscar matrículas por turma:', error);
      return [];
    }
  }

  async getClassEnrollmentsByStudent(studentId: number): Promise<ClassEnrollment[]> {
    try {
      return await db.select().from(classEnrollments)
        .where(eq(classEnrollments.studentId, studentId));
    } catch (error) {
      console.error('Erro ao buscar matrículas por aluno:', error);
      return [];
    }
  }

  async createClassEnrollment(enrollmentData: InsertClassEnrollment): Promise<ClassEnrollment> {
    try {
      const [enrollment] = await db.insert(classEnrollments).values({
        ...enrollmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
        enrollmentDate: enrollmentData.enrollmentDate || new Date(),
        status: enrollmentData.status || "active"
      }).returning();
      
      return enrollment;
    } catch (error) {
      console.error('Erro ao criar matrícula em turma:', error);
      throw error;
    }
  }

  async updateClassEnrollment(id: number, enrollmentData: Partial<InsertClassEnrollment>): Promise<ClassEnrollment> {
    try {
      const updateValues: any = { ...enrollmentData, updatedAt: new Date() };
      
      const [updatedEnrollment] = await db.update(classEnrollments)
        .set(updateValues)
        .where(eq(classEnrollments.id, id))
        .returning();
      
      if (!updatedEnrollment) {
        throw new Error('Matrícula não encontrada');
      }
      
      return updatedEnrollment;
    } catch (error) {
      console.error('Erro ao atualizar matrícula em turma:', error);
      throw error;
    }
  }

  async deleteClassEnrollment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(classEnrollments).where(eq(classEnrollments.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao excluir matrícula em turma:', error);
      return false;
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
      
      const classesCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(classes)
        .where(eq(classes.tenantId, tenantId));
      
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
        classesCount: classesCount[0]?.count || 0,
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
        classesCount: 0,
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