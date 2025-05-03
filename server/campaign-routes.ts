import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { campaigns, courses, users } from '../shared/schema';

export const campaignRouter = Router();

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

// Rota para obter todas as campanhas
campaignRouter.get('/campaigns', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    // Obter tenant ID do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Buscar campanhas associadas ao tenant do usuário
    const campaignsData = await db.query.campaigns.findMany({
      where: eq(campaigns.tenantId, tenantId),
      orderBy: (campaign, { desc }) => [desc(campaign.createdAt)]
    });
    
    // Buscar cursos associados
    const courseIds = campaignsData.filter(c => c.courseId !== null).map(c => c.courseId as number);
    const coursesData = courseIds.length > 0 
      ? await db.query.courses.findMany({
          where: inArray(courses.id, courseIds)
        })
      : [];
      
    // Buscar usuários associados (createdBy)
    const userIds = campaignsData.filter(c => c.createdBy !== null).map(c => c.createdBy as number);
    const usersData = userIds.length > 0
      ? await db.query.users.findMany({
          where: inArray(users.id, userIds)
        })
      : [];
    
    // Formatar as campanhas para enviar ao cliente
    const formattedCampaigns = campaignsData.map(c => {
      // Encontrar o curso associado, se houver
      const relatedCourse = c.courseId 
        ? coursesData.find(course => course.id === c.courseId) 
        : null;
        
      // Encontrar o usuário associado, se houver
      const relatedUser = c.createdBy 
        ? usersData.find(u => u.id === c.createdBy) 
        : null;
      
      return {
        id: c.id,
        tenantId: c.tenantId,
        name: c.name,
        description: c.description,
        type: c.type,
        courseId: c.courseId,
        courseName: relatedCourse ? relatedCourse.title : null,
        budget: c.budget,
        status: c.status,
        audience: c.audience,
        startDate: c.startDate,
        endDate: c.endDate,
        createdBy: c.createdBy,
        createdByName: relatedUser ? relatedUser.fullName : null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        completedAt: c.completedAt
      };
    });

    return res.status(200).json(formattedCampaigns);
  } catch (error: any) {
    console.error('Erro ao buscar campanhas:', error);
    return res.status(500).json({ error: 'Erro ao buscar campanhas', details: error.message });
  }
});

// Rota para obter uma campanha específica
campaignRouter.get('/campaigns/:id', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obter tenant ID do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Buscar campanha
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, parseInt(id)),
        eq(campaigns.tenantId, tenantId)
      )
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    // Buscar dados relacionados
    const relatedCourse = campaign.courseId 
      ? await db.query.courses.findFirst({
          where: eq(courses.id, campaign.courseId as number)
        })
      : null;
      
    const relatedUser = campaign.createdBy 
      ? await db.query.users.findFirst({
          where: eq(users.id, campaign.createdBy as number)
        })
      : null;
    
    // Formatar resposta
    const formattedCampaign = {
      id: campaign.id,
      tenantId: campaign.tenantId,
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      courseId: campaign.courseId,
      courseName: relatedCourse ? relatedCourse.title : null,
      budget: campaign.budget,
      status: campaign.status,
      audience: campaign.audience,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      createdBy: campaign.createdBy,
      createdByName: relatedUser ? relatedUser.fullName : null,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      completedAt: campaign.completedAt
    };

    return res.status(200).json(formattedCampaign);
  } catch (error: any) {
    console.error('Erro ao buscar campanha:', error);
    return res.status(500).json({ error: 'Erro ao buscar campanha', details: error.message });
  }
});

// Rota para criar uma nova campanha
campaignRouter.post('/campaigns', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { 
      name, description, type, courseId, budget, 
      status, audience, startDate, endDate, tenantId 
    } = req.body;
    
    // Obter informações do usuário logado
    const user = req.user as any;
    
    // Validar campos obrigatórios
    if (!name || !type || !tenantId) {
      return res.status(400).json({ error: 'Nome, tipo e ID do tenant são obrigatórios' });
    }
    
    // Criar nova campanha
    const newCampaign = await db.insert(campaigns).values({
      tenantId,
      name,
      description,
      type,
      courseId,
      budget,
      status: status || 'draft',
      audience: audience || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null
    }).returning();
    
    return res.status(201).json(newCampaign[0]);
  } catch (error: any) {
    console.error('Erro ao criar campanha:', error);
    return res.status(500).json({ error: 'Erro ao criar campanha', details: error.message });
  }
});

// Rota para atualizar uma campanha
campaignRouter.put('/campaigns/:id', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, description, type, courseId, budget, 
      status, audience, startDate, endDate 
    } = req.body;
    
    // Obter tenant ID do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Verificar se a campanha existe
    const existingCampaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, parseInt(id)),
        eq(campaigns.tenantId, tenantId)
      )
    });
    
    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    // Verificar se houve alteração de status para "completed"
    let completedAt = existingCampaign.completedAt;
    if (status === 'completed') {
      if (existingCampaign.status !== 'completed') {
        completedAt = new Date();
      }
    } else {
      // Se o status for alterado de completed para outro, remover a data
      if (existingCampaign.status === 'completed') {
        completedAt = null;
      }
    }
    
    // Atualizar campanha
    const updatedCampaign = await db.update(campaigns)
      .set({
        name,
        description,
        type,
        courseId,
        budget,
        status,
        audience,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        updatedAt: new Date(),
        completedAt
      })
      .where(eq(campaigns.id, parseInt(id)))
      .returning();
    
    return res.status(200).json(updatedCampaign[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar campanha:', error);
    return res.status(500).json({ error: 'Erro ao atualizar campanha', details: error.message });
  }
});

// Rota para excluir uma campanha
campaignRouter.delete('/campaigns/:id', isAuthenticated, isAdminOrHub, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obter tenant ID do usuário autenticado
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Verificar se a campanha existe
    const existingCampaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, parseInt(id)),
        eq(campaigns.tenantId, tenantId)
      )
    });
    
    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    // Excluir campanha
    await db.delete(campaigns).where(eq(campaigns.id, parseInt(id)));
    
    return res.status(200).json({ message: 'Campanha excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir campanha:', error);
    return res.status(500).json({ error: 'Erro ao excluir campanha', details: error.message });
  }
});