import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Não autorizado", message: "Você precisa estar autenticado para acessar este recurso" });
};

/**
 * Middleware para verificar se o usuário é administrador
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Não autorizado", message: "Você precisa estar autenticado para acessar este recurso" });
  }
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Acesso negado", message: "Apenas administradores podem acessar este recurso" });
  }
  
  next();
};

/**
 * Middleware para verificar se o usuário é administrador ou professor
 */
export const requireTeacherOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Não autorizado", message: "Você precisa estar autenticado para acessar este recurso" });
  }
  
  if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
    return res.status(403).json({ error: "Acesso negado", message: "Apenas professores e administradores podem acessar este recurso" });
  }
  
  next();
};