import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./database-storage";
import { z } from "zod";
import { insertCourseSchema, insertEnrollmentSchema, insertLeadSchema, insertModuleSchema, insertLessonSchema, insertSubjectSchema, insertClassSchema, insertClassEnrollmentSchema } from "@shared/schema";
import { testDatabaseConnection } from "./db";
import { db } from "./db";
import { tenants, users } from "@shared/schema";
import { log } from "./vite";
import { sql } from "drizzle-orm";

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

      const modules = await storage.getModulesByCourse(courseId);
      res.json(modules);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/courses", isAuthenticated, async (req, res, next) => {
    try {
      // Validate teacher role
      if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Only teachers and admins can create courses" });
      }

      const courseData = insertCourseSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId,
        teacherId: req.user.id
      });

      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      next(error);
    }
  });
  
  // Update an existing course
  app.put("/api/courses/:id", isAuthenticated, async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Check if course exists
      const existingCourse = await storage.getCourseById(courseId);
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user has permission to edit this course
      if (existingCourse.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "You don't have permission to edit this course" });
      }
      
      // Only course creator or admin can edit
      if (req.user?.role !== 'admin' && existingCourse.teacherId !== req.user?.id) {
        return res.status(403).json({ message: "Only the course creator or admins can edit this course" });
      }
      
      // Verificar tentativa de modificação do código por não-administradores
      if (req.body.code !== undefined && req.user?.role !== 'admin') {
        return res.status(403).json({ 
          message: "Apenas administradores podem modificar o código do curso" 
        });
      }
      
      // Validate and update course data
      const courseData = insertCourseSchema.partial().parse({
        ...req.body,
        tenantId: req.user.tenantId,
        updatedAt: new Date()
      });
      
      const updatedCourse = await storage.updateCourse(courseId, courseData);
      res.json(updatedCourse);
    } catch (error) {
      next(error);
    }
  });

  // Enrollments
  app.get("/api/enrollments", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      let enrollments;
      
      if (req.user?.role === 'student') {
        // Students can only see their own enrollments
        enrollments = await storage.getEnrollmentsByStudent(userId);
      } else if (req.user?.role === 'teacher') {
        // Teachers can see enrollments for their courses
        enrollments = await storage.getEnrollmentsByTeacher(userId);
      } else {
        // Admins can see all enrollments for their tenant
        enrollments = await storage.getEnrollmentsByTenant(req.user?.tenantId);
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
  app.get("/api/modules/:id", isAuthenticated, async (req, res, next) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModuleById(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Módulo não encontrado" });
      }
      
      // Verificar se o usuário tem acesso ao curso deste módulo
      const course = await storage.getCourseById(module.courseId);
      if (!course || course.tenantId !== req.user?.tenantId) {
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
      
      // Verificar se o curso existe e pertence ao tenant do usuário
      const course = await storage.getCourseById(moduleData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      if (course.tenantId !== req.user.tenantId) {
        return res.status(403).json({ message: "Você não tem permissão para adicionar módulos a este curso" });
      }
      
      // Verificar se o usuário é o criador do curso ou admin
      if (req.user?.role !== 'admin' && course.teacherId !== req.user?.id) {
        return res.status(403).json({ message: "Apenas o criador do curso ou administradores podem adicionar módulos" });
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
      
      // Verificar se o curso pertence ao tenant do usuário
      const course = await storage.getCourseById(existingModule.courseId);
      if (!course || course.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Verificar se o usuário é o criador do curso ou admin
      if (req.user?.role !== 'admin' && course.teacherId !== req.user?.id) {
        return res.status(403).json({ message: "Apenas o criador do curso ou administradores podem editar módulos" });
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
      
      // Verificar se o curso pertence ao tenant do usuário
      const course = await storage.getCourseById(existingModule.courseId);
      if (!course || course.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Verificar se o usuário é o criador do curso ou admin
      if (req.user?.role !== 'admin' && course.teacherId !== req.user?.id) {
        return res.status(403).json({ message: "Apenas o criador do curso ou administradores podem excluir módulos" });
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

      const subjectData = insertSubjectSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId || 1
      });

      console.log("Dados após validação:", subjectData);

      const subject = await storage.createSubject(subjectData);
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
      } else if (req.user?.role === 'admin' && req.query.studentId) {
        // Admins podem ver matrículas de qualquer aluno
        studentId = parseInt(req.query.studentId as string);
      } else {
        return res.status(400).json({ message: "ID do aluno não fornecido" });
      }
      
      const enrollments = await storage.getClassEnrollmentsByStudent(studentId);
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
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.user?.tenantId;
      const stats = await storage.getDashboardStats(tenantId);
      res.json(stats);
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
    } catch (error) {
      console.error("Erro no teste de admin:", error);
      res.status(500).json({ error: "Erro ao testar admin", details: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
