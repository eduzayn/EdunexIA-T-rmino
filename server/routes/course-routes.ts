import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { courses, insertCourseSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../database-storage';

export const courseRouter = Router();

// Obter todos os cursos
courseRouter.get('/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    const coursesList = await storage.getCoursesByTenant(tenantId);
    res.json(coursesList);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    next(error);
  }
});

// Obter um curso específico
courseRouter.get('/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'ID de curso inválido' });
    }
    
    const course = await storage.getCourseById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Verificar se o curso pertence ao tenant do usuário
    if (course.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este curso' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    next(error);
  }
});

// Criar um novo curso
courseRouter.post('/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    // Verificar permissões (apenas admin ou professor podem criar cursos)
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({ error: 'Você não tem permissão para criar cursos' });
    }
    
    // Validar dados do curso
    const courseData = insertCourseSchema.parse({
      ...req.body,
      tenantId: tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Criar o curso
    const course = await storage.createCourse(courseData);
    
    res.status(201).json(course);
  } catch (error: any) {
    console.error('Erro ao criar curso:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar um curso existente
courseRouter.put('/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'ID de curso inválido' });
    }
    
    // Verificar se o curso existe
    const existingCourse = await storage.getCourseById(courseId);
    
    if (!existingCourse) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Verificar se o curso pertence ao tenant do usuário
    if (existingCourse.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar este curso' });
    }
    
    // Validar e atualizar os dados do curso
    const courseData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Atualizar o curso
    const updatedCourse = await storage.updateCourse(courseId, courseData);
    
    res.json(updatedCourse);
  } catch (error: any) {
    console.error('Erro ao atualizar curso:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Buscar módulos de um curso específico
courseRouter.get('/courses/:id/modules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'ID de curso inválido' });
    }
    
    // Verificar se o curso existe
    const course = await storage.getCourseById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Verificar se o curso pertence ao tenant do usuário
    if (course.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar os módulos deste curso' });
    }
    
    // Buscar módulos do curso
    const modules = await storage.getModulesByCourse(courseId);
    
    res.json(modules);
  } catch (error) {
    console.error('Erro ao buscar módulos do curso:', error);
    next(error);
  }
});

// Excluir um curso
courseRouter.delete('/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'ID de curso inválido' });
    }
    
    // Apenas administradores podem excluir cursos
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem excluir cursos' });
    }
    
    // Verificar se o curso existe
    const existingCourse = await storage.getCourseById(courseId);
    
    if (!existingCourse) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Verificar se o curso pertence ao tenant do usuário
    if (existingCourse.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este curso' });
    }
    
    // Excluir o curso
    await storage.deleteCourse(courseId);
    
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir curso:', error);
    next(error);
  }
});