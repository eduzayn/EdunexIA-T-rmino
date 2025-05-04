import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { eq, and, inArray } from 'drizzle-orm';
import { leads, courses, users } from '../shared/schema';

export const leadRouter = Router();

// Middleware para verificar autenticação
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

// Middleware para verificar se o usuário é admin ou hub
function isAdminOrHub(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (user.role !== 'admin' && user.role !== 'educational_center') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores e centros educacionais podem acessar este recurso.' });
  }
  next();
}

// Rota para obter todos os leads (admin e hub podem ver)
leadRouter.get('/leads', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    // Obter user Id do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Buscar leads associados ao tenant do usuário
    const leadsData = await db.query.leads.findMany({
      where: eq(leads.tenantId, tenantId),
      orderBy: (lead, { desc }) => [desc(lead.createdAt)]
    });
    
    // Buscar cursos associados
    const courseIds = leadsData.filter(l => l.courseInterest !== null).map(l => l.courseInterest as number);
    const coursesData = courseIds.length > 0 
      ? await db.query.courses.findMany({
          where: inArray(courses.id, courseIds)
        })
      : [];
      
    // Buscar usuários associados (assigned to)
    const userIds = leadsData.filter(l => l.assignedTo !== null).map(l => l.assignedTo as number);
    const usersData = userIds.length > 0
      ? await db.query.users.findMany({
          where: inArray(users.id, userIds)
        })
      : [];
    
    // Formatar os leads para enviar ao cliente
    const formattedLeads = leadsData.map(l => {
      // Encontrar o curso associado, se houver
      const relatedCourse = l.courseInterest 
        ? coursesData.find(c => c.id === l.courseInterest) 
        : null;
        
      // Encontrar o usuário associado, se houver
      const relatedUser = l.assignedTo 
        ? usersData.find(u => u.id === l.assignedTo) 
        : null;
      
      return {
        id: l.id,
        tenantId: l.tenantId,
        name: l.name,
        email: l.email,
        phone: l.phone,
        courseInterest: l.courseInterest,
        courseName: relatedCourse ? relatedCourse.title : null,
        status: l.status,
        source: l.source,
        notes: l.notes,
        assignedTo: l.assignedTo,
        assignedToName: relatedUser ? relatedUser.fullName : null,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
      };
    });

    return res.status(200).json(formattedLeads);
  } catch (error: any) {
    console.error('Erro ao buscar leads:', error);
    return res.status(500).json({ error: 'Erro ao buscar leads', details: error.message });
  }
});

// Rota para criar um novo lead
leadRouter.post('/leads', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, courseInterest, source, notes, tenantId, assignedTo } = req.body;
    
    // Validar campos obrigatórios
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
    }
    
    // Verificar se o lead já existe
    const existingLead = await db.query.leads.findFirst({
      where: and(
        eq(leads.email, email),
        eq(leads.tenantId, tenantId)
      )
    });
    
    if (existingLead) {
      return res.status(409).json({ error: 'Lead com este e-mail já existe' });
    }
    
    // Criar novo lead
    const newLead = await db.insert(leads).values({
      tenantId,
      name,
      email,
      phone,
      courseInterest,
      status: 'new',
      source,
      notes,
      assignedTo,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return res.status(201).json(newLead[0]);
  } catch (error: any) {
    console.error('Erro ao criar lead:', error);
    return res.status(500).json({ error: 'Erro ao criar lead', details: error.message });
  }
});

// Rota para atualizar um lead
leadRouter.put('/leads/:id', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, courseInterest, status, source, notes, assignedTo } = req.body;
    
    // Obter user Id do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Verificar se o lead existe
    const existingLead = await db.query.leads.findFirst({
      where: and(
        eq(leads.id, parseInt(id)),
        eq(leads.tenantId, tenantId)
      )
    });
    
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    // Atualizar lead
    const updatedLead = await db.update(leads)
      .set({
        name,
        email,
        phone,
        courseInterest,
        status,
        source,
        notes,
        assignedTo,
        updatedAt: new Date()
      })
      .where(eq(leads.id, parseInt(id)))
      .returning();
    
    return res.status(200).json(updatedLead[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar lead:', error);
    return res.status(500).json({ error: 'Erro ao atualizar lead', details: error.message });
  }
});

// Rota para excluir um lead
leadRouter.delete('/leads/:id', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obter user Id do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Verificar se o lead existe
    const existingLead = await db.query.leads.findFirst({
      where: and(
        eq(leads.id, parseInt(id)),
        eq(leads.tenantId, tenantId)
      )
    });
    
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    // Excluir lead
    await db.delete(leads).where(eq(leads.id, parseInt(id)));
    
    return res.status(200).json({ message: 'Lead excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir lead:', error);
    return res.status(500).json({ error: 'Erro ao excluir lead', details: error.message });
  }
});