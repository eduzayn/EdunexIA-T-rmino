import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertCourseSchema, insertEnrollmentSchema, insertLeadSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);

  return httpServer;
}
