import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { opportunities, leads, courses, users } from '../shared/schema';

export const opportunityRouter = Router();

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

// Rota para obter todas as oportunidades
opportunityRouter.get('/opportunities', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    // Obter tenant ID do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Buscar oportunidades associadas ao tenant do usuário
    const opportunitiesData = await db.query.opportunities.findMany({
      where: eq(opportunities.tenantId, tenantId),
      orderBy: (opportunity, { desc }) => [desc(opportunity.createdAt)]
    });
    
    // Buscar leads associados
    const leadIds = opportunitiesData.filter(o => o.leadId !== null).map(o => o.leadId as number);
    const leadsData = leadIds.length > 0 
      ? await db.query.leads.findMany({
          where: inArray(leads.id, leadIds)
        })
      : [];
      
    // Buscar cursos associados
    const courseIds = opportunitiesData.filter(o => o.courseId !== null).map(o => o.courseId as number);
    const coursesData = courseIds.length > 0 
      ? await db.query.courses.findMany({
          where: inArray(courses.id, courseIds)
        })
      : [];
      
    // Buscar usuários associados (assigned to)
    const userIds = opportunitiesData.filter(o => o.assignedTo !== null).map(o => o.assignedTo as number);
    const usersData = userIds.length > 0
      ? await db.query.users.findMany({
          where: inArray(users.id, userIds)
        })
      : [];
    
    // Formatar as oportunidades para enviar ao cliente
    const formattedOpportunities = opportunitiesData.map(o => {
      // Encontrar o lead associado, se houver
      const relatedLead = o.leadId 
        ? leadsData.find(l => l.id === o.leadId) 
        : null;
        
      // Encontrar o curso associado, se houver
      const relatedCourse = o.courseId 
        ? coursesData.find(c => c.id === o.courseId) 
        : null;
        
      // Encontrar o usuário associado, se houver
      const relatedUser = o.assignedTo 
        ? usersData.find(u => u.id === o.assignedTo) 
        : null;
      
      return {
        id: o.id,
        tenantId: o.tenantId,
        title: o.title,
        leadId: o.leadId,
        leadName: relatedLead ? relatedLead.name : null,
        courseId: o.courseId,
        courseName: relatedCourse ? relatedCourse.title : null,
        value: o.value,
        predictedClosingDate: o.predictedClosingDate,
        status: o.status,
        assignedTo: o.assignedTo,
        assignedToName: relatedUser ? relatedUser.fullName : null,
        probability: o.probability,
        notes: o.notes,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        closedAt: o.closedAt
      };
    });

    return res.status(200).json(formattedOpportunities);
  } catch (error: any) {
    console.error('Erro ao buscar oportunidades:', error);
    return res.status(500).json({ error: 'Erro ao buscar oportunidades', details: error.message });
  }
});

// Rota para obter uma oportunidade específica
opportunityRouter.get('/opportunities/:id', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obter tenant ID do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Buscar oportunidade
    const opportunity = await db.query.opportunities.findFirst({
      where: and(
        eq(opportunities.id, parseInt(id)),
        eq(opportunities.tenantId, tenantId)
      )
    });
    
    if (!opportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }
    
    // Buscar dados relacionados
    const relatedLead = opportunity.leadId 
      ? await db.query.leads.findFirst({
          where: eq(leads.id, opportunity.leadId as number)
        })
      : null;
      
    const relatedCourse = opportunity.courseId 
      ? await db.query.courses.findFirst({
          where: eq(courses.id, opportunity.courseId as number)
        })
      : null;
      
    const relatedUser = opportunity.assignedTo 
      ? await db.query.users.findFirst({
          where: eq(users.id, opportunity.assignedTo as number)
        })
      : null;
    
    // Formatar resposta
    const formattedOpportunity = {
      id: opportunity.id,
      tenantId: opportunity.tenantId,
      title: opportunity.title,
      leadId: opportunity.leadId,
      leadName: relatedLead ? relatedLead.name : null,
      courseId: opportunity.courseId,
      courseName: relatedCourse ? relatedCourse.title : null,
      value: opportunity.value,
      predictedClosingDate: opportunity.predictedClosingDate,
      status: opportunity.status,
      assignedTo: opportunity.assignedTo,
      assignedToName: relatedUser ? relatedUser.fullName : null,
      probability: opportunity.probability,
      notes: opportunity.notes,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      closedAt: opportunity.closedAt
    };

    return res.status(200).json(formattedOpportunity);
  } catch (error: any) {
    console.error('Erro ao buscar oportunidade:', error);
    return res.status(500).json({ error: 'Erro ao buscar oportunidade', details: error.message });
  }
});

// Rota para criar uma nova oportunidade
opportunityRouter.post('/opportunities', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { 
      title, leadId, courseId, value, predictedClosingDate, 
      status, assignedTo, probability, notes, tenantId 
    } = req.body;
    
    // Validar campos obrigatórios
    if (!title || !tenantId) {
      return res.status(400).json({ error: 'Título e ID do tenant são obrigatórios' });
    }
    
    // Criar nova oportunidade
    const newOpportunity = await db.insert(opportunities).values({
      tenantId,
      title,
      leadId,
      courseId,
      value,
      predictedClosingDate: predictedClosingDate ? new Date(predictedClosingDate) : null,
      status: status || 'open',
      assignedTo,
      probability: probability || 50,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      closedAt: null
    }).returning();
    
    return res.status(201).json(newOpportunity[0]);
  } catch (error: any) {
    console.error('Erro ao criar oportunidade:', error);
    return res.status(500).json({ error: 'Erro ao criar oportunidade', details: error.message });
  }
});

// Rota para atualizar uma oportunidade
opportunityRouter.put('/opportunities/:id', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, leadId, courseId, value, predictedClosingDate, 
      status, assignedTo, probability, notes 
    } = req.body;
    
    // Obter tenant ID do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Verificar se a oportunidade existe
    const existingOpportunity = await db.query.opportunities.findFirst({
      where: and(
        eq(opportunities.id, parseInt(id)),
        eq(opportunities.tenantId, tenantId)
      )
    });
    
    if (!existingOpportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }
    
    // Verificar se houve alteração de status para "won" ou "lost"
    let closedAt = existingOpportunity.closedAt;
    if (status === 'won' || status === 'lost') {
      if (existingOpportunity.status !== 'won' && existingOpportunity.status !== 'lost') {
        closedAt = new Date();
      }
    } else {
      // Se o status for alterado de won/lost para outro, remover a data de fechamento
      if (existingOpportunity.status === 'won' || existingOpportunity.status === 'lost') {
        closedAt = null;
      }
    }
    
    // Atualizar oportunidade
    const updatedOpportunity = await db.update(opportunities)
      .set({
        title,
        leadId,
        courseId,
        value,
        predictedClosingDate: predictedClosingDate ? new Date(predictedClosingDate) : null,
        status,
        assignedTo,
        probability,
        notes,
        updatedAt: new Date(),
        closedAt
      })
      .where(eq(opportunities.id, parseInt(id)))
      .returning();
    
    return res.status(200).json(updatedOpportunity[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar oportunidade:', error);
    return res.status(500).json({ error: 'Erro ao atualizar oportunidade', details: error.message });
  }
});

// Rota para excluir uma oportunidade
opportunityRouter.delete('/opportunities/:id', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obter tenant ID do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Verificar se a oportunidade existe
    const existingOpportunity = await db.query.opportunities.findFirst({
      where: and(
        eq(opportunities.id, parseInt(id)),
        eq(opportunities.tenantId, tenantId)
      )
    });
    
    if (!existingOpportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }
    
    // Excluir oportunidade
    await db.delete(opportunities).where(eq(opportunities.id, parseInt(id)));
    
    return res.status(200).json({ message: 'Oportunidade excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir oportunidade:', error);
    return res.status(500).json({ error: 'Erro ao excluir oportunidade', details: error.message });
  }
});