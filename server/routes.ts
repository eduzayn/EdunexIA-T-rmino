import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./database-storage";
import { z } from "zod";
import path from "path";
import { 
  insertCourseSchema, insertEnrollmentSchema, insertLeadSchema, 
  insertModuleSchema, insertLessonSchema, insertSubjectSchema, 
  insertClassSchema, insertClassEnrollmentSchema, insertUserSchema,
  insertAssessmentSchema, insertAssessmentResultSchema,
  courseSubjects, insertCourseSubjectSchema
} from "@shared/schema";
import { testDatabaseConnection } from "./db";
import { db } from "./db";
import { tenants, users } from "@shared/schema";
import { log } from "./vite";
import { sql, eq } from "drizzle-orm";
import { studentRouter } from "./student-routes";
import { adminRouter } from "./admin-routes";
import { adminPaymentRouter } from "./admin-payment-routes";
import { adminDocumentRouter } from "./admin-document-routes";
import { partnerRouter } from "./partner-routes";
import { certificateRouter } from "./certificate-routes";
import simplifiedEnrollmentRouter from "./simplified-enrollment-routes";
import contractRouter from "./contract-routes";
import { leadRouter } from "./lead-routes";
import { opportunityRouter } from "./opportunity-routes";
import { campaignRouter } from "./campaign-routes";
import { aiRouter } from "./ai-routes-fixed";
import { settingsRouter } from "./settings-routes";
import { courseRouter } from "./routes/course-routes";
import { notificationService } from "./services/notification-service";
import courseImageRouter from "./routes/course-image-upload";

export async function registerRoutes(app: Express): Promise<Server> {
  // Teste de conexão com banco de dados e inicialização
  try {
    const dbConnected = await testDatabaseConnection();
    if (dbConnected) {
      log("Conexão com banco de dados PostgreSQL estabelecida com sucesso", "database");
      
      // Criar tenant padrão se não existir
      try {
        await db.insert(tenants).values({
          name: "Edunéxia",
          domain: "edunexia.com",
          logoUrl: null,
          primaryColor: "#6366f1",
          secondaryColor: "#a855f7",
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
        log("Tenant padrão criado ou verificado com sucesso", "database");
        
        // Criar um usuário administrativo para testes
        try {
          const { hashPassword } = await import("./auth");
          const { users } = await import("@shared/schema");
          
          const hashedPassword = await hashPassword("password123");
          await db.insert(users).values({
            username: "admintest",
            password: hashedPassword,
            email: "admin@edunexia.com",
            fullName: "Administrador Teste",
            role: "admin",
            tenantId: 1,
            isActive: true,
            avatarUrl: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }).onConflictDoNothing();
          log("Usuário administrativo de teste criado ou verificado com sucesso", "database");
        } catch (error) {
          console.error("Erro ao criar usuário administrativo:", error);
        }
      } catch (error) {
        console.error("Erro ao criar tenant padrão:", error);
      }
    } else {
      log("Falha na conexão com o banco de dados PostgreSQL", "database");
    }
  } catch (error) {
    console.error("Erro ao testar conexão com banco de dados:", error);
  }
  
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // API routes
  // Courses
  app.get("/api/courses", isAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.user?.tenantId || 1;
      const courses = await storage.getCoursesByTenant(tenantId);
      res.json(courses);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/courses/:id", isAuthenticated, async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourseById(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check tenant access
      if (course.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(course);
    } catch (error) {
      next(error);
    }
  });
  
  // Get modules for a specific course
  app.get("/api/courses/:id/modules", isAuthenticated, async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourseById(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check tenant access
      if (course.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Buscar as disciplinas do curso
      const courseSubjects = await storage.getCourseSubjects(courseId);
      
      // Se não houver disciplinas, retornar lista vazia
      if (courseSubjects.length === 0) {
        return res.json([]);
      }
      
      // Buscar e combinar módulos de todas as disciplinas do curso
      const allModules = [];
      for (const courseSubject of courseSubjects) {
        const modules = await storage.getModulesBySubject(courseSubject.subjectId);
        allModules.push(...modules);
      }
      
      res.json(allModules);
    } catch (error) {
      next(error);
    }
  });

  // As rotas de cursos foram movidas para courseRouter em server/routes/course-routes.ts

  // Enrollments
  app.get("/api/enrollments", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      let enrollments: any[] = [];
      
      if (req.user?.role === 'student' && userId) {
        // Students can only see their own enrollments
        enrollments = await storage.getEnrollmentsByStudent(userId);
      } else if (req.user?.role === 'teacher' && userId) {
        // Teachers can see enrollments for their courses
        enrollments = await storage.getEnrollmentsByTeacher(userId);
      } else if (req.user?.tenantId) {
        // Admins can see all enrollments for their tenant
        enrollments = await storage.getEnrollmentsByTenant(req.user.tenantId);
      }
      
      res.json(enrollments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res, next) => {
    try {
      // Students can only enroll themselves, admins can enroll any student
      if (req.user?.role === 'student' && req.body.studentId !== req.user.id) {
        return res.status(403).json({ message: "Students can only enroll themselves" });
      }

      const enrollmentData = insertEnrollmentSchema.parse({
        ...req.body,
        studentId: req.body.studentId || req.user?.id
      });

      // Check if course exists and belongs to tenant
      const course = await storage.getCourseById(enrollmentData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (course.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Cannot enroll in courses from other tenants" });
      }

      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      next(error);
    }
  });

  // CRM - Leads
  app.get("/api/leads", isAuthenticated, async (req, res, next) => {
    try {
      // Only admins and educational centers can access leads
      if (req.user?.role !== 'admin' && req.user?.role !== 'educational_center') {
        return res.status(403).json({ message: "Access denied" });
      }

      const leads = await storage.getLeadsByTenant(req.user.tenantId);
      res.json(leads);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/leads", async (req, res, next) => {
    try {
      // Public endpoint for lead capture, but requires tenantId
      const tenantId = req.body.tenantId || 1;
      
      const leadData = insertLeadSchema.parse({
        ...req.body,
        tenantId
      });

      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      next(error);
    }
  });

  // Módulos
  // Obter todos os módulos (filtrados por courseId se fornecido)
  app.get("/api/modules", isAuthenticated, async (req, res, next) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Caso de uso 1: filtrar por disciplina específica
      if (subjectId) {
        // Verificar se a disciplina existe e se o usuário tem acesso a ela
        const subject = await storage.getSubjectById(subjectId);
        if (!subject) {
          return res.status(404).json({ message: "Disciplina não encontrada" });
        }
        
        if (subject.tenantId !== tenantId) {
          return res.status(403).json({ message: "Acesso negado à disciplina especificada" });
        }
        
        // Retornar apenas os módulos desta disciplina
        const subjectModules = await storage.getModulesBySubject(subjectId);
        return res.json(subjectModules);
      } 
      // Caso de uso 2: compatibilidade com frontend - filtrar por curso
      else if (courseId) {
        // Verificar se o curso existe e se o usuário tem acesso a ele
        const course = await storage.getCourseById(courseId);
        if (!course) {
          return res.status(404).json({ message: "Curso não encontrado" });
        }
        
        if (course.tenantId !== tenantId) {
          return res.status(403).json({ message: "Acesso negado ao curso especificado" });
        }
        
        // Buscar todas as disciplinas associadas ao curso
        const courseSubjects = await storage.getCourseSubjects(courseId);
        
        // Se não houver disciplinas, retornar lista vazia
        if (courseSubjects.length === 0) {
          return res.json([]);
        }
        
        // Buscar e combinar módulos de todas as disciplinas do curso
        const allModules = [];
        for (const courseSubject of courseSubjects) {
          const modules = await storage.getModulesBySubject(courseSubject.subjectId);
          allModules.push(...modules);
        }
        
        return res.json(allModules);
      } 
      // Caso de uso 3: listar todos os módulos do tenant
      else {
        // Se não for especificado um courseId ou subjectId, retornar todos os módulos do tenant
        const subjects = await storage.getSubjectsByTenant(tenantId);
        
        // Se não houver disciplinas, retornar lista vazia
        if (subjects.length === 0) {
          return res.json([]);
        }
        
        // Buscar e combinar módulos de todas as disciplinas do tenant
        const allModules = [];
        for (const subject of subjects) {
          const modules = await storage.getModulesBySubject(subject.id);
          allModules.push(...modules);
        }
        
        return res.json(allModules);
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Obter um módulo específico pelo ID
  app.get("/api/modules/:id", isAuthenticated, async (req, res, next) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModuleById(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Módulo não encontrado" });
      }
      
      // Verificar se o usuário tem acesso à disciplina deste módulo
      const subject = await storage.getSubjectById(module.subjectId);
      if (!subject || subject.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(module);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/modules", isAuthenticated, async (req, res, next) => {
    try {
      // Validar role de professor e admin
      if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas professores e admins podem criar módulos" });
      }
      
      const moduleData = insertModuleSchema.parse(req.body);
      
      // Verificar se a disciplina existe e pertence ao tenant do usuário
      const subject = await storage.getSubjectById(moduleData.subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      if (subject.tenantId !== req.user.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para adicionar módulos a esta disciplina" });
      }
      
      // Verificar permissões do usuário (admin ou professor responsável)
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas professores e administradores podem adicionar módulos" });
      }
      
      const module = await storage.createModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/modules/:id", isAuthenticated, async (req, res, next) => {
    try {
      const moduleId = parseInt(req.params.id);
      
      // Verificar se o módulo existe
      const existingModule = await storage.getModuleById(moduleId);
      if (!existingModule) {
        return res.status(404).json({ message: "Módulo não encontrado" });
      }
      
      // Verificar se a disciplina pertence ao tenant do usuário
      const subject = await storage.getSubjectById(existingModule.subjectId);
      if (!subject || subject.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Verificar se o usuário tem permissão (professor ou admin)
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas professores e administradores podem editar módulos" });
      }
      
      // Validar e atualizar dados do módulo
      const moduleData = insertModuleSchema.partial().parse(req.body);
      
      const updatedModule = await storage.updateModule(moduleId, moduleData);
      res.json(updatedModule);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/modules/:id", isAuthenticated, async (req, res, next) => {
    try {
      const moduleId = parseInt(req.params.id);
      
      // Verificar se o módulo existe
      const existingModule = await storage.getModuleById(moduleId);
      if (!existingModule) {
        return res.status(404).json({ message: "Módulo não encontrado" });
      }
      
      // Verificar se a disciplina pertence ao tenant do usuário
      const subject = await storage.getSubjectById(existingModule.subjectId);
      if (!subject || subject.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Verificar permissões do usuário (admin ou professor)
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas professores ou administradores podem excluir módulos" });
      }
      
      const deleted = await storage.deleteModule(moduleId);
      if (deleted) {
        res.status(200).json({ message: "Módulo excluído com sucesso" });
      } else {
        res.status(500).json({ message: "Falha ao excluir módulo" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Subjects (Disciplinas)
  app.get("/api/subjects", isAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.user?.tenantId || 1;
      const subjects = await storage.getSubjectsByTenant(tenantId);
      res.json(subjects);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/subjects/:id", isAuthenticated, async (req, res, next) => {
    try {
      const subjectId = parseInt(req.params.id);
      const subject = await storage.getSubjectById(subjectId);
      
      if (!subject) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }

      // Verificar acesso ao tenant
      if (subject.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(subject);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/subjects", isAuthenticated, async (req, res, next) => {
    try {
      // Apenas administradores e professores podem criar disciplinas
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas administradores e professores podem criar disciplinas" });
      }

      console.log("Dados recebidos:", req.body);
      console.log("Usuário atual:", req.user?.id, req.user?.tenantId);

      // Vamos usar o schema apenas para validar os campos obrigatórios do formulário
      // O código será gerado automaticamente pelo método createSubject
      const validatedData = {
        ...req.body,
        tenantId: req.user.tenantId || 1
      };

      console.log("Dados para criação:", validatedData);

      const subject = await storage.createSubject(validatedData);
      console.log("Disciplina criada:", subject);
      
      res.status(201).json(subject);
    } catch (error) {
      console.error("Erro ao criar disciplina:", error);
      next(error);
    }
  });

  app.put("/api/subjects/:id", isAuthenticated, async (req, res, next) => {
    try {
      const subjectId = parseInt(req.params.id);
      
      // Verificar se a disciplina existe
      const existingSubject = await storage.getSubjectById(subjectId);
      if (!existingSubject) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Verificar acesso ao tenant
      if (existingSubject.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para editar esta disciplina" });
      }
      
      // Apenas administradores e professores podem editar disciplinas
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas administradores e professores podem editar disciplinas" });
      }
      
      // Validar e atualizar dados da disciplina
      const subjectData = insertSubjectSchema.partial().parse({
        ...req.body,
        updatedAt: new Date()
      });
      
      const updatedSubject = await storage.updateSubject(subjectId, subjectData);
      res.json(updatedSubject);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/subjects/:id", isAuthenticated, async (req, res, next) => {
    try {
      const subjectId = parseInt(req.params.id);
      
      // Verificar se a disciplina existe
      const existingSubject = await storage.getSubjectById(subjectId);
      if (!existingSubject) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Verificar acesso ao tenant
      if (existingSubject.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para excluir esta disciplina" });
      }
      
      // Apenas administradores podem excluir disciplinas
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem excluir disciplinas" });
      }
      
      const deleted = await storage.deleteSubject(subjectId);
      if (deleted) {
        res.status(200).json({ message: "Disciplina excluída com sucesso" });
      } else {
        res.status(500).json({ message: "Falha ao excluir disciplina" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Associações entre Cursos e Disciplinas
  // Obter disciplinas de um curso
  app.get("/api/courses/:id/subjects", isAuthenticated, async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Verificar se o curso existe
      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      // Verificar acesso ao tenant
      if (course.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const courseSubjects = await storage.getCourseSubjects(courseId);
      
      // Buscar informações completas das disciplinas
      const subjects = await Promise.all(
        courseSubjects.map(async (cs) => {
          const subject = await storage.getSubjectById(cs.subjectId);
          return {
            ...subject,
            courseSubjectId: cs.id,
            order: cs.order
          };
        })
      );
      
      res.json(subjects);
    } catch (error) {
      next(error);
    }
  });
  
  // Adicionar disciplina a um curso
  app.post("/api/courses/:id/subjects", isAuthenticated, async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Verificar se o curso existe
      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      // Verificar acesso ao tenant
      if (course.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Apenas administradores e professores responsáveis podem adicionar disciplinas
      if (req.user?.role !== 'admin' && 
          (req.user?.role !== 'teacher' || course.teacherId !== req.user?.id)) {
        return res.status(403).json({ message: "Apenas administradores ou o professor responsável pode adicionar disciplinas ao curso" });
      }
      
      const { subjectId, order } = req.body;
      
      if (!subjectId) {
        return res.status(400).json({ message: "ID da disciplina é obrigatório" });
      }
      
      // Verificar se a disciplina existe
      const subject = await storage.getSubjectById(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Verificar se a disciplina pertence ao mesmo tenant do curso
      if (subject.tenantId !== course.tenantId) {
        return res.status(403).json({ message: "A disciplina não pertence ao mesmo tenant do curso" });
      }
      
      // Verificar se a disciplina já está associada ao curso
      const existingSubjects = await storage.getCourseSubjects(courseId);
      const alreadyAdded = existingSubjects.some(cs => cs.subjectId === subjectId);
      
      if (alreadyAdded) {
        return res.status(400).json({ message: "Esta disciplina já está associada ao curso" });
      }
      
      // Adicionar a disciplina ao curso
      const courseSubject = await storage.addSubjectToCourse({
        courseId,
        subjectId,
        order: order || existingSubjects.length + 1
      });
      
      res.status(201).json(courseSubject);
    } catch (error) {
      next(error);
    }
  });
  
  // Remover disciplina de um curso
  app.delete("/api/courses/:courseId/subjects/:subjectId", isAuthenticated, async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const subjectId = parseInt(req.params.subjectId);
      
      // Verificar se o curso existe
      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      // Verificar acesso ao tenant
      if (course.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Apenas administradores e professores responsáveis podem remover disciplinas
      if (req.user?.role !== 'admin' && 
          (req.user?.role !== 'teacher' || course.teacherId !== req.user?.id)) {
        return res.status(403).json({ message: "Apenas administradores ou o professor responsável pode remover disciplinas do curso" });
      }
      
      // Verificar se a disciplina está associada ao curso
      const courseSubjects = await storage.getCourseSubjects(courseId);
      const isAssociated = courseSubjects.some(cs => cs.subjectId === subjectId);
      
      if (!isAssociated) {
        return res.status(404).json({ message: "Esta disciplina não está associada ao curso" });
      }
      
      // Remover a disciplina do curso
      const removed = await storage.removeSubjectFromCourse(courseId, subjectId);
      
      if (removed) {
        res.status(200).json({ message: "Disciplina removida do curso com sucesso" });
      } else {
        res.status(500).json({ message: "Falha ao remover disciplina do curso" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Atualizar ordem das disciplinas em um curso
  app.put("/api/course-subjects/:id", isAuthenticated, async (req, res, next) => {
    try {
      const courseSubjectId = parseInt(req.params.id);
      const { order } = req.body;
      
      if (order === undefined) {
        return res.status(400).json({ message: "A ordem é obrigatória" });
      }
      
      // Buscar a relação curso-disciplina usando a função de storage
      const courseSubjectInfo = await storage.getCourseSubjectById(courseSubjectId);
      
      if (!courseSubjectInfo) {
        return res.status(404).json({ message: "Relação curso-disciplina não encontrada" });
      }
      
      const courseSubject = courseSubjectInfo;
      
      // Verificar se o curso existe e se o usuário tem acesso
      const course = await storage.getCourseById(courseSubject.courseId);
      if (!course || course.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Apenas administradores e professores responsáveis podem alterar a ordem
      if (req.user?.role !== 'admin' && 
          (req.user?.role !== 'teacher' || course.teacherId !== req.user?.id)) {
        return res.status(403).json({ message: "Apenas administradores ou o professor responsável pode alterar a ordem das disciplinas" });
      }
      
      // Atualizar a ordem
      const updatedCourseSubject = await storage.updateCourseSubjectOrder(courseSubjectId, order);
      
      res.json(updatedCourseSubject);
    } catch (error) {
      next(error);
    }
  });

  // Turmas (Classes)
  app.get("/api/classes", isAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.user?.tenantId || 1;
      const classes = await storage.getClassesByTenant(tenantId);
      res.json(classes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/classes/:id", isAuthenticated, async (req, res, next) => {
    try {
      const classId = parseInt(req.params.id);
      const classItem = await storage.getClassById(classId);
      
      if (!classItem) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }

      // Verificar acesso ao tenant
      if (classItem.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(classItem);
    } catch (error) {
      next(error);
    }
  });

  // Obter turmas por disciplina
  app.get("/api/subjects/:id/classes", isAuthenticated, async (req, res, next) => {
    try {
      const subjectId = parseInt(req.params.id);
      const subject = await storage.getSubjectById(subjectId);
      
      if (!subject) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }

      // Verificar acesso ao tenant
      if (subject.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const classes = await storage.getClassesBySubject(subjectId);
      res.json(classes);
    } catch (error) {
      next(error);
    }
  });

  // Obter turmas por professor
  app.get("/api/teacher/classes", isAuthenticated, async (req, res, next) => {
    try {
      if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const teacherId = req.user.id;
      const classes = await storage.getClassesByTeacher(teacherId);
      res.json(classes);
    } catch (error) {
      next(error);
    }
  });

  // Criar nova turma
  app.post("/api/classes", isAuthenticated, async (req, res, next) => {
    try {
      // Apenas administradores e professores podem criar turmas
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas administradores e professores podem criar turmas" });
      }

      const classData = insertClassSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId || 1
      });

      // Verificar se a disciplina existe e pertence ao tenant
      const subject = await storage.getSubjectById(classData.subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      if (subject.tenantId !== req.user.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para criar turmas para esta disciplina" });
      }

      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      console.error("Erro ao criar turma:", error);
      next(error);
    }
  });

  // Atualizar turma existente
  app.put("/api/classes/:id", isAuthenticated, async (req, res, next) => {
    try {
      const classId = parseInt(req.params.id);
      
      // Verificar se a turma existe
      const existingClass = await storage.getClassById(classId);
      if (!existingClass) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }
      
      // Verificar acesso ao tenant
      if (existingClass.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para editar esta turma" });
      }
      
      // Apenas administradores, professores responsáveis podem editar turmas
      if (req.user?.role !== 'admin' && 
          (req.user?.role !== 'teacher' || existingClass.teacherId !== req.user?.id)) {
        return res.status(403).json({ message: "Apenas administradores ou o professor responsável pode editar esta turma" });
      }
      
      // Validar e atualizar dados da turma
      const classData = insertClassSchema.partial().parse({
        ...req.body,
        updatedAt: new Date()
      });
      
      const updatedClass = await storage.updateClass(classId, classData);
      res.json(updatedClass);
    } catch (error) {
      next(error);
    }
  });

  // Excluir turma
  app.delete("/api/classes/:id", isAuthenticated, async (req, res, next) => {
    try {
      const classId = parseInt(req.params.id);
      
      // Verificar se a turma existe
      const existingClass = await storage.getClassById(classId);
      if (!existingClass) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }
      
      // Verificar acesso ao tenant
      if (existingClass.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Apenas administradores podem excluir turmas
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem excluir turmas" });
      }
      
      const deleted = await storage.deleteClass(classId);
      if (deleted) {
        res.status(200).json({ message: "Turma excluída com sucesso" });
      } else {
        res.status(500).json({ message: "Falha ao excluir turma" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Matrículas em Turmas (Class Enrollments)
  app.get("/api/classes/:id/enrollments", isAuthenticated, async (req, res, next) => {
    try {
      const classId = parseInt(req.params.id);
      
      // Verificar se a turma existe
      const classItem = await storage.getClassById(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }
      
      // Verificar acesso ao tenant
      if (classItem.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const enrollments = await storage.getClassEnrollmentsByClass(classId);
      res.json(enrollments);
    } catch (error) {
      next(error);
    }
  });

  // Obter matrículas em turmas por aluno
  app.get("/api/student/class-enrollments", isAuthenticated, async (req, res, next) => {
    try {
      let studentId;
      
      // Estudantes só podem ver suas próprias matrículas
      if (req.user?.role === 'student') {
        studentId = req.user.id;
      } else if (req.user?.role === 'admin') {
        // Admins podem ver matrículas de qualquer aluno ou suas próprias
        if (req.query.studentId) {
          studentId = parseInt(req.query.studentId as string);
        } else {
          // Se admin não especificar um studentId, usamos o ID do próprio admin logado
          studentId = req.user.id;
        }
      } else {
        return res.status(400).json({ message: "ID do aluno não fornecido" });
      }
      
      const enrollments = await storage.getClassEnrollmentsByStudent(studentId);
      
      // Se for admin e não tiver matrículas, retornar dados simulados para testes
      if (req.user?.role === 'admin' && (!enrollments || enrollments.length === 0)) {
        const mockEnrollments = [
          {
            id: 101,
            studentId: studentId,
            classId: 201,
            enrollmentDate: new Date('2025-03-01T10:00:00Z'),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 102,
            studentId: studentId,
            classId: 202,
            enrollmentDate: new Date('2025-04-15T09:30:00Z'),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        return res.json(mockEnrollments);
      }
      
      res.json(enrollments);
    } catch (error) {
      next(error);
    }
  });

  // Matricular aluno em uma turma
  app.post("/api/class-enrollments", isAuthenticated, async (req, res, next) => {
    try {
      // Alunos só podem matricular a si mesmos, admins podem matricular qualquer aluno
      if (req.user?.role === 'student' && req.body.studentId !== req.user.id) {
        return res.status(403).json({ message: "Alunos só podem matricular a si mesmos" });
      }

      const enrollmentData = insertClassEnrollmentSchema.parse({
        ...req.body,
        studentId: req.body.studentId || req.user?.id
      });

      // Verificar se a turma existe e pertence ao tenant
      const classItem = await storage.getClassById(enrollmentData.classId);
      if (!classItem) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }
      
      if (classItem.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Não é possível matricular em turmas de outros tenants" });
      }

      // Verificar se a turma está cheia
      if (classItem.maxStudents) {
        const currentEnrollments = await storage.getClassEnrollmentsByClass(classItem.id);
        if (currentEnrollments.length >= classItem.maxStudents) {
          return res.status(400).json({ message: "Turma está com lotação máxima" });
        }
      }

      const enrollment = await storage.createClassEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      next(error);
    }
  });

  // Atualizar matrícula em turma
  app.put("/api/class-enrollments/:id", isAuthenticated, async (req, res, next) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      
      // Verificar se a matrícula existe
      // Para simplificar, assumimos que existe e será tratado como erro mais tarde se não existir
      
      // Apenas administradores e professores podem atualizar matrículas
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas administradores e professores podem atualizar matrículas" });
      }
      
      // Validar e atualizar dados da matrícula
      const enrollmentData = insertClassEnrollmentSchema.partial().parse({
        ...req.body,
        updatedAt: new Date()
      });
      
      const updatedEnrollment = await storage.updateClassEnrollment(enrollmentId, enrollmentData);
      res.json(updatedEnrollment);
    } catch (error) {
      next(error);
    }
  });

  // Cancelar matrícula em turma
  app.delete("/api/class-enrollments/:id", isAuthenticated, async (req, res, next) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      
      // Verificar se a matrícula existe
      // Para simplificar, assumimos que existe e será tratado como erro mais tarde se não existir
      
      // Apenas administradores podem excluir matrículas
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem excluir matrículas" });
      }
      
      const deleted = await storage.deleteClassEnrollment(enrollmentId);
      if (deleted) {
        res.status(200).json({ message: "Matrícula excluída com sucesso" });
      } else {
        res.status(500).json({ message: "Falha ao excluir matrícula" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Dashboard stats
  // Cache para as estatísticas do dashboard para evitar consultas frequentes
  const dashboardStatsCache = new Map();
  const CACHE_TTL = 60 * 1000; // 1 minuto em milissegundos
  
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.user?.tenantId || 1;
      const cacheKey = `dashboard_stats_${tenantId}`;
      
      // Verificar se temos dados em cache válidos
      const cachedData = dashboardStatsCache.get(cacheKey);
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
        // Retornar dados do cache se estiverem dentro do TTL
        log(`Usando dashboard stats do cache para tenant ${tenantId}`, "dashboard");
        return res.json(cachedData.data);
      }
      
      // Caso contrário, buscar dados do banco de dados
      log(`Buscando dashboard stats para tenant ${tenantId}`, "dashboard");
      const startTime = Date.now();
      
      // Definir um timeout para a requisição (5 segundos)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao buscar estatísticas do dashboard')), 5000);
      });
      
      // Correr a consulta ao banco com limite de tempo
      const dataPromise = storage.getDashboardStats(tenantId);
      
      // Usar Promise.race para aplicar o timeout
      const stats = await Promise.race([dataPromise, timeoutPromise]) as any;
      
      // Calcular tempo de resposta
      const responseTime = Date.now() - startTime;
      log(`Dashboard stats obtidos em ${responseTime}ms`, "dashboard");
      
      // Atualizar o cache com os novos dados
      dashboardStatsCache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });
      
      // Retornar os dados
      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar stats do dashboard:", error);
      
      // Tentar usar cache expirado em caso de erro
      const tenantId = req.user?.tenantId || 1;
      const cacheKey = `dashboard_stats_${tenantId}`;
      const cachedData = dashboardStatsCache.get(cacheKey);
      
      if (cachedData) {
        // Usar cache mesmo expirado em caso de erro
        log(`Usando cache expirado para dashboard stats devido a erro`, "dashboard");
        return res.json(cachedData.data);
      }
      
      // Se não houver cache, passar o erro para o próximo middleware
      next(error);
    }
  });
  
  // ==================== GERENCIAMENTO DE ALUNOS ====================
  
  // Listar todos os alunos
  app.get("/api/students", isAuthenticated, async (req, res, next) => {
    try {
      // Apenas administradores e professores podem listar todos os alunos
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas administradores e professores podem listar todos os alunos" });
      }
      
      const tenantId = req.user?.tenantId;
      const students = await storage.getStudentsByTenant(tenantId);
      res.json(students);
    } catch (error) {
      next(error);
    }
  });
  
  // Obter um aluno específico pelo ID
  app.get("/api/students/:id", isAuthenticated, async (req, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Verificar permissões: admins, professores ou o próprio aluno
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher' && req.user?.id !== studentId) {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      const student = await storage.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }
      
      // Verificar se o aluno pertence ao mesmo tenant
      if (student.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(student);
    } catch (error) {
      next(error);
    }
  });
  
  // Criar um novo aluno
  app.post("/api/students", isAuthenticated, async (req, res, next) => {
    try {
      // Apenas administradores podem criar alunos
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem criar alunos" });
      }
      
      // Validar os dados do aluno
      const userData = insertUserSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId,
        role: 'student' // Forçar o papel como 'student'
      });
      
      // Verificar se já existe um usuário com o mesmo nome de usuário
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      
      const student = await storage.createUser(userData);
      res.status(201).json(student);
    } catch (error) {
      next(error);
    }
  });
  
  // Atualizar um aluno
  app.put("/api/students/:id", isAuthenticated, async (req, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Obter o aluno para verificar permissões
      const student = await storage.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }
      
      // Verificar permissões: apenas admins ou o próprio aluno
      if (req.user?.role !== 'admin' && req.user?.id !== studentId) {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      // Verificar se o aluno pertence ao mesmo tenant
      if (student.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Validar dados de atualização
      let userData = req.body;
      
      // Se não for admin, restringir campos que podem ser atualizados
      if (req.user?.role !== 'admin') {
        // Usuários normais só podem atualizar alguns campos pessoais
        const { fullName, avatarUrl, email } = req.body;
        userData = { fullName, avatarUrl, email };
      }
      
      // Garantir que o role permaneça como student
      userData.role = 'student';
      
      // Validar e atualizar
      const validatedUserData = insertUserSchema.partial().parse({
        ...userData,
        updatedAt: new Date()
      });
      
      const updatedStudent = await storage.updateUser(studentId, validatedUserData);
      res.json(updatedStudent);
    } catch (error) {
      next(error);
    }
  });
  
  // Excluir um aluno
  app.delete("/api/students/:id", isAuthenticated, async (req, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Apenas administradores podem excluir alunos
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem excluir alunos" });
      }
      
      // Obter o aluno para verificar permissões
      const student = await storage.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }
      
      // Verificar se o aluno pertence ao mesmo tenant
      if (student.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const deleted = await storage.deleteUser(studentId);
      if (deleted) {
        res.status(200).json({ message: "Aluno excluído com sucesso" });
      } else {
        res.status(500).json({ message: "Falha ao excluir aluno" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Listar matrículas de um aluno específico em turmas
  app.get("/api/students/:id/class-enrollments", isAuthenticated, async (req, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Verificar permissões: admins, professores ou o próprio aluno
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher' && req.user?.id !== studentId) {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      // Verificar se o aluno existe
      const student = await storage.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }
      
      // Verificar se o aluno pertence ao mesmo tenant
      if (student.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const enrollments = await storage.getClassEnrollmentsByStudent(studentId);
      res.json(enrollments);
    } catch (error) {
      next(error);
    }
  });
  
  // ==================== GERENCIAMENTO DE PROFESSORES ====================
  
  // Listar todos os professores
  app.get("/api/teachers", isAuthenticated, async (req, res, next) => {
    try {
      // Apenas administradores podem listar todos os professores
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem listar todos os professores" });
      }
      
      const tenantId = req.user?.tenantId;
      const teachers = await storage.getTeachersByTenant(tenantId);
      res.json(teachers);
    } catch (error) {
      next(error);
    }
  });
  
  // Obter um professor específico pelo ID
  app.get("/api/teachers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      // Verificar permissões: admins ou o próprio professor
      if (req.user?.role !== 'admin' && req.user?.id !== teacherId) {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      // Verificar se o professor existe
      const teacher = await storage.getTeacherById(teacherId);
      
      if (!teacher) {
        return res.status(404).json({ message: "Professor não encontrado" });
      }
      
      // Verificar se o professor pertence ao mesmo tenant
      if (teacher.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(teacher);
    } catch (error) {
      next(error);
    }
  });
  
  // Criar um novo professor
  app.post("/api/teachers", isAuthenticated, async (req, res, next) => {
    try {
      // Apenas administradores podem criar professores
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem criar professores" });
      }
      
      const teacherData = insertUserSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId,
        role: 'teacher'
      });
      
      const teacher = await storage.createUser(teacherData);
      res.status(201).json(teacher);
    } catch (error) {
      next(error);
    }
  });
  
  // Atualizar um professor existente
  app.put("/api/teachers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      // Verificar permissões: admins ou o próprio professor
      if (req.user?.role !== 'admin' && req.user?.id !== teacherId) {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      // Verificar se o professor existe
      const teacher = await storage.getTeacherById(teacherId);
      
      if (!teacher) {
        return res.status(404).json({ message: "Professor não encontrado" });
      }
      
      // Verificar se o professor pertence ao mesmo tenant
      if (teacher.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Não permitir alteração do role
      const { role, ...updateData } = req.body;
      
      const updatedTeacher = await storage.updateUser(teacherId, updateData);
      res.json(updatedTeacher);
    } catch (error) {
      next(error);
    }
  });
  
  // Excluir um professor
  app.delete("/api/teachers/:id", isAuthenticated, async (req, res, next) => {
    try {
      // Apenas administradores podem excluir professores
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem excluir professores" });
      }
      
      const teacherId = parseInt(req.params.id);
      
      // Verificar se o professor existe
      const teacher = await storage.getTeacherById(teacherId);
      
      if (!teacher) {
        return res.status(404).json({ message: "Professor não encontrado" });
      }
      
      // Verificar se o professor pertence ao mesmo tenant
      if (teacher.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const success = await storage.deleteUser(teacherId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Falha ao excluir professor" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Listar turmas de um professor específico
  app.get("/api/teachers/:id/classes", isAuthenticated, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      // Verificar permissões: admins ou o próprio professor
      if (req.user?.role !== 'admin' && req.user?.id !== teacherId) {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      // Verificar se o professor existe
      const teacher = await storage.getTeacherById(teacherId);
      
      if (!teacher) {
        return res.status(404).json({ message: "Professor não encontrado" });
      }
      
      // Verificar se o professor pertence ao mesmo tenant
      if (teacher.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const classes = await storage.getClassesByTeacher(teacherId);
      res.json(classes);
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint para diagnóstico (apenas para desenvolvimento)
  app.get("/api/debug", async (req, res) => {
    try {
      // Obter usuário admin
      const adminUser = await storage.getUserByUsername("admintest");
      const dbConnectionOk = await testDatabaseConnection();
      
      // Retornar estado do sistema
      res.json({
        database: {
          connected: dbConnectionOk,
          url: process.env.DATABASE_URL ? "Configurado" : "Não configurado"
        },
        usersCount: adminUser ? 1 : 0,
        adminUser: adminUser ? {
          id: adminUser.id,
          username: adminUser.username,
          passwordFormat: adminUser.password ? (adminUser.password.includes(".") ? "valid" : "invalid") : "missing",
          role: adminUser.role,
          tenantId: adminUser.tenantId
        } : null,
        environment: {
          nodeEnv: process.env.NODE_ENV
        }
      });
    } catch (error) {
      console.error("Erro ao obter debug:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });
  
  // Rota específica para testar a criação do admin
  app.get("/api/test-admin", async (req, res) => {
    try {
      // Verificar se o banco está conectado
      const dbConnectionOk = await testDatabaseConnection();
      
      if (!dbConnectionOk) {
        return res.status(500).json({ error: "Banco de dados não conectado" });
      }
      
      // Verificar se o tenant existe
      let tenant = await db.select().from(tenants).where(sql`id = 1`).limit(1);
      
      if (!tenant || tenant.length === 0) {
        // Criar tenant se não existir
        const [newTenant] = await db.insert(tenants).values({
          name: "Edunéxia",
          domain: "edunexia.com",
          logoUrl: null,
          primaryColor: "#6366f1",
          secondaryColor: "#a855f7",
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        tenant = [newTenant];
      }
      
      // Verificar se o admin existe
      const adminUser = await storage.getUserByUsername("admintest");
      
      if (!adminUser) {
        // Importar a função de hash
        const { hashPassword } = await import("./auth");
        // Criar o admin
        const hashedPassword = await hashPassword("password123");
        const [newAdmin] = await db.insert(users).values({
          username: "admintest",
          password: hashedPassword,
          email: "admin@edunexia.com",
          fullName: "Administrador Teste",
          role: "admin",
          tenantId: 1,
          isActive: true,
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        return res.json({
          message: "Usuário admin criado com sucesso",
          tenant: tenant[0],
          admin: {
            id: newAdmin.id,
            username: newAdmin.username,
            role: newAdmin.role
          }
        });
      }
      
      return res.json({
        message: "Usuário admin já existe",
        tenant: tenant[0],
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role
        }
      });
    } catch (error: any) {
      console.error("Erro no teste de admin:", error);
      res.status(500).json({ error: "Erro ao testar admin", details: error.message });
    }
  });

  // Assessments (Avaliações)
  // Listar todas as avaliações da instituição
  app.get("/api/assessments", isAuthenticated, async (req, res, next) => {
    try {
      // Verificar se o usuário tem permissão (admin ou professor)
      if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas administradores e professores podem listar todas as avaliações" });
      }
      
      const assessments = await storage.getAssessmentsByTenant(req.user.tenantId);
      res.json(assessments);
    } catch (error) {
      next(error);
    }
  });
  
  // Listar avaliações por turma
  app.get("/api/classes/:classId/assessments", isAuthenticated, async (req, res, next) => {
    try {
      const classId = parseInt(req.params.classId);
      
      // Verificar se a turma existe
      const classData = await storage.getClassById(classId);
      if (!classData) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }
      
      // Verificar se o usuário tem acesso a esta turma (mesmo tenant)
      if (classData.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para acessar esta turma" });
      }
      
      const assessments = await storage.getAssessmentsByClass(classId);
      res.json(assessments);
    } catch (error) {
      next(error);
    }
  });

  // Obter uma avaliação específica
  app.get("/api/assessments/:id", isAuthenticated, async (req, res, next) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const assessment = await storage.getAssessmentById(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ message: "Avaliação não encontrada" });
      }
      
      // Verificar permissão (mesmo tenant)
      if (assessment.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para acessar esta avaliação" });
      }
      
      res.json(assessment);
    } catch (error) {
      next(error);
    }
  });

  // Criar uma nova avaliação
  app.post("/api/assessments", isAuthenticated, async (req, res, next) => {
    try {
      // Apenas professores e admins podem criar avaliações
      if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Apenas professores e administradores podem criar avaliações" });
      }
      
      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId,
        createdBy: req.user.id
      });
      
      // Verificar se a turma existe e pertence ao mesmo tenant
      const classData = await storage.getClassById(assessmentData.classId);
      if (!classData) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }
      
      if (classData.tenantId !== req.user.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para criar avaliações para esta turma" });
      }
      
      // Se o usuário for professor, verificar se ele é o professor da turma
      if (req.user.role === 'teacher' && classData.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Apenas o professor responsável pela turma pode criar avaliações para ela" });
      }
      
      const assessment = await storage.createAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      next(error);
    }
  });

  // Atualizar uma avaliação existente
  app.put("/api/assessments/:id", isAuthenticated, async (req, res, next) => {
    try {
      const assessmentId = parseInt(req.params.id);
      
      // Verificar se a avaliação existe
      const assessment = await storage.getAssessmentById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Avaliação não encontrada" });
      }
      
      // Verificar permissão (mesmo tenant)
      if (assessment.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para editar esta avaliação" });
      }
      
      // Se for professor, verificar se ele é o criador da avaliação
      if (req.user.role === 'teacher' && assessment.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Apenas o criador da avaliação ou administradores podem editá-la" });
      }
      
      const assessmentData = insertAssessmentSchema.partial().parse({
        ...req.body,
        tenantId: req.user.tenantId
      });
      
      const updatedAssessment = await storage.updateAssessment(assessmentId, assessmentData);
      res.json(updatedAssessment);
    } catch (error) {
      next(error);
    }
  });

  // Excluir uma avaliação
  app.delete("/api/assessments/:id", isAuthenticated, async (req, res, next) => {
    try {
      const assessmentId = parseInt(req.params.id);
      
      // Verificar se a avaliação existe
      const assessment = await storage.getAssessmentById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Avaliação não encontrada" });
      }
      
      // Verificar permissão (mesmo tenant)
      if (assessment.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para excluir esta avaliação" });
      }
      
      // Se for professor, verificar se ele é o criador da avaliação
      if (req.user.role === 'teacher' && assessment.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Apenas o criador da avaliação ou administradores podem excluí-la" });
      }
      
      const success = await storage.deleteAssessment(assessmentId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Erro ao excluir avaliação" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Assessment Results (Resultados de Avaliações)
  // Listar resultados de uma avaliação
  app.get("/api/assessments/:assessmentId/results", isAuthenticated, async (req, res, next) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      
      // Verificar se a avaliação existe
      const assessment = await storage.getAssessmentById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Avaliação não encontrada" });
      }
      
      // Verificar permissão (mesmo tenant)
      if (assessment.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para acessar os resultados desta avaliação" });
      }
      
      // Alunos só podem ver seus próprios resultados
      if (req.user.role === 'student') {
        const result = await storage.getAssessmentResultsByAssessment(assessmentId)
          .then(results => results.filter(r => r.studentId === req.user?.id));
        return res.json(result);
      }
      
      // Professores só podem ver resultados de suas próprias avaliações
      if (req.user.role === 'teacher') {
        // Verificar se esta avaliação foi criada pelo professor atual
        if (assessment.createdBy !== req.user.id) {
          return res.status(403).json({ message: "Você não tem permissão para acessar os resultados desta avaliação" });
        }
      }
      
      const results = await storage.getAssessmentResultsByAssessment(assessmentId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  // Obter resultados de um estudante específico
  app.get("/api/students/:studentId/assessment-results", isAuthenticated, async (req, res, next) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Alunos só podem ver seus próprios resultados
      if (req.user?.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ message: "Você só pode visualizar seus próprios resultados" });
      }
      
      // Verificar se o estudante existe e pertence ao mesmo tenant
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Estudante não encontrado" });
      }
      
      if (student.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para acessar os resultados deste estudante" });
      }
      
      const results = await storage.getAssessmentResultsByStudent(studentId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  // Criar um resultado de avaliação
  app.post("/api/assessment-results", isAuthenticated, async (req, res, next) => {
    try {
      // Todos podem submeter resultados, mas alunos só podem submeter para si próprios
      const resultData = insertAssessmentResultSchema.parse(req.body);
      
      // Se for aluno, só pode submeter para si mesmo
      if (req.user?.role === 'student' && resultData.studentId !== req.user.id) {
        return res.status(403).json({ message: "Você só pode submeter resultados para si mesmo" });
      }
      
      // Verificar se a avaliação existe
      const assessment = await storage.getAssessmentById(resultData.assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Avaliação não encontrada" });
      }
      
      // Verificar permissão (mesmo tenant)
      if (assessment.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para submeter resultados para esta avaliação" });
      }
      
      // Verificar se o estudante existe e pertence ao mesmo tenant
      const student = await storage.getStudentById(resultData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Estudante não encontrado" });
      }
      
      if (student.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para submeter resultados para este estudante" });
      }
      
      const result = await storage.createAssessmentResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  // Atualizar um resultado de avaliação (ex: professor atribuindo nota)
  app.put("/api/assessment-results/:id", isAuthenticated, async (req, res, next) => {
    try {
      const resultId = parseInt(req.params.id);
      
      // Verificar se o resultado existe
      const result = await storage.getAssessmentResultById(resultId);
      if (!result) {
        return res.status(404).json({ message: "Resultado não encontrado" });
      }
      
      // Alunos só podem atualizar seus próprios resultados e não podem atribuir notas
      if (req.user?.role === 'student') {
        if (result.studentId !== req.user.id) {
          return res.status(403).json({ message: "Você só pode atualizar seus próprios resultados" });
        }
        
        // Alunos não podem atribuir ou modificar notas
        if (req.body.score !== undefined || req.body.gradedBy !== undefined) {
          return res.status(403).json({ message: "Estudantes não podem atribuir notas" });
        }
      }
      
      // Verificar se o professor tem permissão para avaliar esta turma
      if (req.user?.role === 'teacher') {
        const assessment = await storage.getAssessmentById(result.assessmentId);
        if (!assessment) {
          return res.status(404).json({ message: "Avaliação não encontrada" });
        }
        
        // Verificar se o professor é o criador da avaliação
        if (assessment.createdBy !== req.user.id) {
          return res.status(403).json({ message: "Apenas o professor que criou a avaliação pode atribuir notas" });
        }
      }
      
      const resultData = insertAssessmentResultSchema.partial().parse({
        ...req.body,
        // Se estiver atribuindo nota, registrar quem avaliou
        ...(req.body.score !== undefined && { gradedBy: req.user?.id })
      });
      
      const updatedResult = await storage.updateAssessmentResult(resultId, resultData);
      res.json(updatedResult);
    } catch (error) {
      next(error);
    }
  });

  // Excluir um resultado de avaliação
  app.delete("/api/assessment-results/:id", isAuthenticated, async (req, res, next) => {
    try {
      const resultId = parseInt(req.params.id);
      
      // Verificar se o resultado existe
      const result = await storage.getAssessmentResultById(resultId);
      if (!result) {
        return res.status(404).json({ message: "Resultado não encontrado" });
      }
      
      // Verificar se é admin ou o professor que criou a avaliação
      if (req.user?.role !== 'admin') {
        const assessment = await storage.getAssessmentById(result.assessmentId);
        if (!assessment || assessment.createdBy !== req.user?.id) {
          return res.status(403).json({ message: "Apenas administradores ou o professor que criou a avaliação podem excluir resultados" });
        }
      }
      
      const success = await storage.deleteAssessmentResult(resultId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Erro ao excluir resultado de avaliação" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Adicionar rotas do Portal do Aluno
  app.use('/api/student', isAuthenticated, studentRouter);
  
  // Middleware para verificar se o usuário é administrador
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ message: 'Forbidden - Requires Admin Role' });
  };
  
  // Adicionar rotas administrativas com verificação de administrador
  app.use('/api/admin', isAdmin, adminRouter);
  app.use('/api/admin', isAdmin, adminPaymentRouter);
  app.use('/api/admin', isAdmin, adminDocumentRouter);
  
  // Adicionar rotas do Portal do Parceiro
  app.use('/api/partner', isAuthenticated, partnerRouter);
  
  // Adicionar rotas de certificados
  app.use('/api/certificates', isAuthenticated, certificateRouter);
  
  // Adicionar rotas de matrícula simplificada
  app.use('/api', simplifiedEnrollmentRouter);
  app.use('/api', contractRouter);
  app.use('/api', leadRouter);
  app.use('/api', opportunityRouter);
  app.use('/api', campaignRouter);
  app.use('/api/ai', isAuthenticated, aiRouter);
  app.use('/api/settings', isAuthenticated, settingsRouter);
  
  // Rota de API para gerenciamento de cursos
  app.use('/api', isAuthenticated, courseRouter);
  
  // Adicionar rotas para upload de imagens de cursos
  app.use('/api/course-images', isAuthenticated, courseImageRouter);
  
  // Configurar pasta de uploads como estática
  // Usamos o path relativo para garantir que o Express encontrará os arquivos
  // Como estamos usando ES modules, não podemos usar __dirname
  const uploadsPath = path.resolve('./uploads');
  console.log(`[DEBUG] Configurando pasta de uploads estáticos: ${uploadsPath}`);
  app.use('/uploads', express.static(uploadsPath));
  
  // Rota de teste para envio de SMS (apenas para ambiente de desenvolvimento e admins)
  app.post('/api/admin/test-sms', isAuthenticated, async (req, res) => {
    try {
      // Verificar se é administrador
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Apenas administradores podem testar o envio de SMS' });
      }
      
      const { phoneNumber, name } = req.body;
      
      if (!phoneNumber || !name) {
        return res.status(400).json({ 
          error: 'Dados incompletos',
          details: 'Forneça phoneNumber e name'
        });
      }
      
      // Enviar SMS de teste
      const sent = await notificationService.sendAccessCredentials(
        phoneNumber,
        name,
        'aluno@exemplo.com',
        '12345678900'  // CPF fictício para teste
      );
      
      if (sent) {
        return res.json({ success: true, message: `SMS enviado com sucesso para ${phoneNumber}` });
      } else {
        return res.status(500).json({ error: 'Falha ao enviar SMS' });
      }
    } catch (error: any) {
      console.error('Erro ao testar envio de SMS:', error);
      return res.status(500).json({ error: 'Erro ao enviar SMS', details: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
