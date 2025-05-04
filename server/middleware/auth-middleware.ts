import { Request, Response, NextFunction } from 'express';

// Middleware para verificar se o usuário está autenticado
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ 
    error: "Não autorizado", 
    message: "Você precisa estar logado para acessar este recurso" 
  });
}