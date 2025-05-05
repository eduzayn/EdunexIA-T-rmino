import { Request, Response, NextFunction } from 'express';
import { User as SelectUser } from '@shared/schema';

type RoleType = 'admin' | 'student' | 'teacher' | 'partner' | 'hub';

/**
 * Middleware para verificar se o usuário tem permissão para acessar recursos
 * específicos com base em seu papel (role)
 * 
 * @param allowedRoles Array de papéis que têm permissão para acessar o recurso
 * @returns Middleware de Express para verificação de acesso
 */
export function checkRole(allowedRoles: RoleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as SelectUser | undefined;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Administradores sempre têm acesso a qualquer recurso
    if (user.role === 'admin') {
      return next();
    }
    
    // Verificar se o papel do usuário está na lista de papéis permitidos
    if (allowedRoles.includes(user.role as RoleType)) {
      return next();
    }
    
    // Acesso negado
    return res.status(403).json({ 
      error: 'Acesso negado. Você não tem permissão para acessar este recurso.' 
    });
  };
}

/**
 * Verifica se o usuário é admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as SelectUser | undefined;
  
  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  
  if (user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
    });
  }
  
  next();
}

/**
 * Verifica se o usuário é estudante ou admin
 */
export function isStudent(req: Request, res: Response, next: NextFunction) {
  return checkRole(['student'])(req, res, next);
}

/**
 * Verifica se o usuário é professor ou admin
 */
export function isTeacher(req: Request, res: Response, next: NextFunction) {
  return checkRole(['teacher'])(req, res, next);
}

/**
 * Verifica se o usuário é parceiro ou admin
 */
export function isPartner(req: Request, res: Response, next: NextFunction) {
  return checkRole(['partner'])(req, res, next);
}

/**
 * Verifica se o usuário é gestor de polo ou admin
 */
export function isHub(req: Request, res: Response, next: NextFunction) {
  return checkRole(['hub'])(req, res, next);
}

/**
 * Verifica se o usuário é professor ou estudante ou admin
 */
export function isTeacherOrStudent(req: Request, res: Response, next: NextFunction) {
  return checkRole(['teacher', 'student'])(req, res, next);
}

/**
 * Verifica se o usuário está autenticado (qualquer papel)
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  
  next();
}