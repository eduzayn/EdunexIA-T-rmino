import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertCourseSchema, insertEnrollmentSchema, insertLeadSchema } from "@shared/schema";
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
