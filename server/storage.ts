import { 
  users, type User, type InsertUser,
  tenants, type Tenant, type InsertTenant,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  leads, type Lead, type InsertLead
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

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

// In-memory implementation for development/testing
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private tenantsData: Map<number, Tenant>;
  private coursesData: Map<number, Course>;
  private enrollmentsData: Map<number, Enrollment>;
  private leadsData: Map<number, Lead>;
  sessionStore: session.Store;
  
  private userId: number;
  private tenantId: number;
  private courseId: number;
  private enrollmentId: number;
  private leadId: number;

  constructor() {
    this.usersData = new Map();
    this.tenantsData = new Map();
    this.coursesData = new Map();
    this.enrollmentsData = new Map();
    this.leadsData = new Map();
    
    this.userId = 1;
    this.tenantId = 1;
    this.courseId = 1;
    this.enrollmentId = 1;
    this.leadId = 1;
    
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo tenant
    const demoTenant: Tenant = {
      id: this.tenantId++,
      name: "Edunéxia Demo",
      domain: "demo.edunexia.com",
      logoUrl: "/logo.svg",
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tenantsData.set(demoTenant.id, demoTenant);
    
    // Create admin user
    const adminUser: User = {
      id: this.userId++,
      tenantId: demoTenant.id,
      username: "admin",
      password: "a3c12f4c07f3227038bd80ab2c8c6cea90e14db9e6f68b42ccabb46f8f22480ba5dc8a686b35580a9e3d0319894173e0e6b63b35eedb78f4d5ac44acc94ed241.2e0cb7a8f51d4c55cdbd059ba9eb7ab6", // "password123" hashed
      email: "admin@edunexia.com",
      fullName: "Carlos Silva",
      role: "admin",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.usersData.set(adminUser.id, adminUser);
    
    // Create some courses
    const courses = [
      {
        title: "Desenvolvimento Web Full Stack",
        description: "Curso completo de desenvolvimento web, do básico ao avançado",
        imageUrl: null,
        price: 199700, // R$ 1.997,00
        status: "published",
        teacherId: adminUser.id
      },
      {
        title: "Marketing Digital Avançado",
        description: "Aprenda a criar estratégias de marketing digital eficientes",
        imageUrl: null,
        price: 129700, // R$ 1.297,00
        status: "published",
        teacherId: adminUser.id
      },
      {
        title: "Inteligência Artificial para Negócios",
        description: "Como aplicar IA para transformar seu negócio",
        imageUrl: null,
        price: 249700, // R$ 2.497,00
        status: "published",
        teacherId: adminUser.id
      },
      {
        title: "Investimentos e Finanças Pessoais",
        description: "Domine suas finanças e aprenda a investir de forma inteligente",
        imageUrl: null,
        price: 99700, // R$ 997,00
        status: "published",
        teacherId: adminUser.id
      }
    ];
    
    courses.forEach(course => {
      const newCourse: Course = {
        id: this.courseId++,
        tenantId: demoTenant.id,
        ...course,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.coursesData.set(newCourse.id, newCourse);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.usersData.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now
    };
    this.usersData.set(id, user);
    return user;
  }

  // Tenant operations
  async getTenantById(id: number): Promise<Tenant | undefined> {
    return this.tenantsData.get(id);
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const id = this.tenantId++;
    const now = new Date();
    const tenant: Tenant = {
      id,
      ...tenantData,
      createdAt: now,
      updatedAt: now
    };
    this.tenantsData.set(id, tenant);
    return tenant;
  }

  // Course operations
  async getCourseById(id: number): Promise<Course | undefined> {
    return this.coursesData.get(id);
  }

  async getCoursesByTenant(tenantId: number): Promise<Course[]> {
    const tenantCourses: Course[] = [];
    for (const course of this.coursesData.values()) {
      if (course.tenantId === tenantId) {
        tenantCourses.push(course);
      }
    }
    return tenantCourses;
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const now = new Date();
    const course: Course = {
      id,
      ...courseData,
      createdAt: now,
      updatedAt: now
    };
    this.coursesData.set(id, course);
    return course;
  }

  // Enrollment operations
  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    const studentEnrollments: Enrollment[] = [];
    for (const enrollment of this.enrollmentsData.values()) {
      if (enrollment.studentId === studentId) {
        studentEnrollments.push(enrollment);
      }
    }
    return studentEnrollments;
  }

  async getEnrollmentsByTeacher(teacherId: number): Promise<Enrollment[]> {
    const teacherEnrollments: Enrollment[] = [];
    for (const enrollment of this.enrollmentsData.values()) {
      const course = this.coursesData.get(enrollment.courseId);
      if (course && course.teacherId === teacherId) {
        teacherEnrollments.push(enrollment);
      }
    }
    return teacherEnrollments;
  }

  async getEnrollmentsByTenant(tenantId: number): Promise<Enrollment[]> {
    const tenantEnrollments: Enrollment[] = [];
    for (const enrollment of this.enrollmentsData.values()) {
      const course = this.coursesData.get(enrollment.courseId);
      if (course && course.tenantId === tenantId) {
        tenantEnrollments.push(enrollment);
      }
    }
    return tenantEnrollments;
  }

  async createEnrollment(enrollmentData: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentId++;
    const now = new Date();
    const enrollment: Enrollment = {
      id,
      ...enrollmentData,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.enrollmentsData.set(id, enrollment);
    return enrollment;
  }

  // Lead operations
  async getLeadsByTenant(tenantId: number): Promise<Lead[]> {
    const tenantLeads: Lead[] = [];
    for (const lead of this.leadsData.values()) {
      if (lead.tenantId === tenantId) {
        tenantLeads.push(lead);
      }
    }
    return tenantLeads;
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    const id = this.leadId++;
    const now = new Date();
    const lead: Lead = {
      id,
      ...leadData,
      createdAt: now,
      updatedAt: now
    };
    this.leadsData.set(id, lead);
    return lead;
  }

  // Dashboard statistics
  async getDashboardStats(tenantId: number): Promise<any> {
    // Count active students (users with role 'student')
    let activeStudents = 0;
    for (const user of this.usersData.values()) {
      if (user.tenantId === tenantId && user.role === 'student' && user.isActive) {
        activeStudents++;
      }
    }

    // Count active courses
    let activeCourses = 0;
    for (const course of this.coursesData.values()) {
      if (course.tenantId === tenantId && course.status === 'published') {
        activeCourses++;
      }
    }

    // Calculate monthly revenue (simplified for demo)
    const monthlyRevenue = 284512; // R$ 284.512,00

    // Calculate course completion rate (simplified for demo)
    const completionRate = 78.3;

    // Get popular courses (simplified for demo)
    const popularCourses = Array.from(this.coursesData.values())
      .filter(course => course.tenantId === tenantId)
      .slice(0, 4)
      .map(course => ({
        ...course,
        studentsCount: Math.floor(Math.random() * 500) + 200,
        rating: (Math.random() * 1 + 4).toFixed(1) // Random rating between 4.0 and 5.0
      }));

    // Get latest enrollments (simplified for demo)
    const latestEnrollments = [
      {
        id: 1,
        student: {
          id: 101,
          name: "Lucas Mendes",
          email: "lucasmendes@gmail.com",
          avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        course: {
          id: 1,
          title: "Desenvolvimento Web",
          type: "Full Stack"
        },
        amount: 199700,
        status: "active",
        date: "20/07/2023",
        paymentStatus: "paid"
      },
      {
        id: 2,
        student: {
          id: 102,
          name: "Bruno Alves",
          email: "bruno.alves@hotmail.com",
          avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        course: {
          id: 2,
          title: "Marketing Digital",
          type: "Avançado"
        },
        amount: 129700,
        status: "active",
        date: "18/07/2023",
        paymentStatus: "paid"
      },
      {
        id: 3,
        student: {
          id: 103,
          name: "Camila Santos",
          email: "camila@uol.com.br",
          avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        course: {
          id: 3,
          title: "IA para Negócios",
          type: "Módulo Completo"
        },
        amount: 249700,
        status: "pending",
        date: "17/07/2023",
        paymentStatus: "pending"
      }
    ];

    // Get recent activity (simplified for demo)
    const recentActivity = [
      {
        id: 1,
        user: {
          name: "Ana Martins",
          avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        action: "Concluiu o curso \"Introdução à Inteligência Artificial\" com nota 9.8",
        time: "Há 12 min",
        badge: "Curso concluído",
        badgeColor: "green"
      },
      {
        id: 2,
        user: {
          name: "Rafael Oliveira",
          avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        action: "Inscreveu-se no curso \"Desenvolvimento Web Avançado\" no plano anual",
        time: "Há 45 min",
        badge: "Nova inscrição",
        badgeColor: "blue",
        secondaryBadge: "R$ 1.200,00",
        secondaryBadgeColor: "green"
      },
      {
        id: 3,
        user: {
          name: "Pedro Santos",
          avatarUrl: null
        },
        action: "Registrou-se como novo aluno na plataforma",
        time: "Há 3h",
        badge: "Novo usuário",
        badgeColor: "purple"
      },
      {
        id: 4,
        user: {
          name: "Maria Costa",
          avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        action: "Fez um pagamento para renovação de assinatura anual",
        time: "Há 5h",
        badge: "R$ 997,00",
        badgeColor: "green",
        secondaryBadge: "Assinatura",
        secondaryBadgeColor: "yellow"
      }
    ];

    return {
      activeStudents,
      activeCourses,
      monthlyRevenue,
      completionRate,
      popularCourses,
      latestEnrollments,
      recentActivity
    };
  }
}

// Importando a implementação de banco de dados
import { DatabaseStorage } from './database-storage';

// Use MemStorage para desenvolvimento sem banco de dados
// export const storage = new MemStorage();

// Use DatabaseStorage para armazenamento em banco de dados PostgreSQL
export const storage = new DatabaseStorage();
