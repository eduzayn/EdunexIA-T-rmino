import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './database-storage';

export const publicRouter = Router();

// Rota pública para obter detalhes de um curso
publicRouter.get('/public/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'ID de curso inválido' });
    }
    
    // Buscar curso pelo ID (sem verificar tenantId)
    // Nota: Em uma aplicação real, ainda seria importante verificar se o curso está publicado
    const course = await storage.getCourseById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Retornamos o curso para visualização pública
    res.json(course);
  } catch (error) {
    console.error('Erro ao buscar curso público:', error);
    next(error);
  }
});