import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './database-storage';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { libraryMaterials, insertMessageSchema, userMessages, userSettings } from '../shared/schema';
import { eq, and, desc, or } from 'drizzle-orm';

export const studentRouter = Router();

// Middleware para verificar se o usuário é um aluno
function isStudent(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  
  if (user.role !== 'student' && user.role !== 'admin') { // permitindo admin para testes
    return res.status(403).json({ error: 'Acesso negado. Apenas alunos podem acessar este recurso.' });
  }
  
  next();
}

// Obter cursos do aluno
studentRouter.get('/courses', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    // Para administradores, retornar dados simulados para testes
    if (req.user?.role === 'admin') {
      return res.json([
        {
          id: 1,
          tenantId: 1,
          name: 'Desenvolvimento Web Full Stack',
          description: 'Curso completo de desenvolvimento web com front-end e back-end',
          code: 'WEB-001',
          imageUrl: null,
          status: 'active',
          createdAt: '2025-01-15T10:00:00Z',
          progress: 65,
          subjectsCount: 3
        },
        {
          id: 2,
          tenantId: 1,
          name: 'Data Science e Inteligência Artificial',
          description: 'Fundamentos e aplicações práticas de ciência de dados e IA',
          code: 'DATA-002',
          imageUrl: null,
          status: 'active',
          createdAt: '2025-02-01T10:00:00Z',
          progress: 32,
          subjectsCount: 4
        },
        {
          id: 3,
          tenantId: 1,
          name: 'Design UX/UI',
          description: 'Princípios de design de interfaces e experiência do usuário',
          code: 'UX-003',
          imageUrl: null,
          status: 'active',
          createdAt: '2025-03-10T10:00:00Z',
          progress: 18,
          subjectsCount: 2
        }
      ]);
    }
    
    // Para estudantes reais (não admin)
    // Buscar matrículas do aluno e depois os cursos relacionados
    const enrollments = await storage.getEnrollmentsByStudent(userId);
    
    // Se não tiver matrículas, retornar array vazio
    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }
    
    // Obter IDs dos cursos das matrículas
    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    
    // Buscar os cursos para cada matrícula
    const coursesPromises = courseIds.map(async (courseId) => {
      const course = await storage.getCourseById(courseId);
      
      if (!course) return null;
      
      // Adicionar dados de progresso (em um sistema real, seria calculado com base no progresso do aluno)
      // Aqui estamos atribuindo um valor aleatório para demonstração
      const progress = Math.floor(Math.random() * 100);
      
      // Em uma implementação real, contaria as disciplinas do curso
      // Como o método não existe ainda, vamos simular com um valor fixo
      const subjectsCount = 2;
      
      return {
        ...course,
        progress,
        subjectsCount
      };
    });
    
    const courses = (await Promise.all(coursesPromises)).filter(Boolean);
    res.json(courses);
  } catch (error) {
    console.error('Erro ao buscar cursos do aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar cursos do aluno' });
  }
});

// Obter matrículas em turmas do aluno
studentRouter.get('/class-enrollments', async (req: Request, res: Response) => {
  try {
    console.log("Chamada para /class-enrollments recebida. Usuário:", req.user);
    
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    // Se for admin, retornar dados simulados para teste
    if (req.user?.role === 'admin') {
      console.log("Usuário é admin, retornando dados simulados");
      // Retornando dados simulados para facilitar testes
      return res.json([
        {
          id: 101,
          studentId: userId,
          classId: 201,
          enrollmentDate: '2025-03-01T10:00:00Z',
          status: 'active',
          class: {
            id: 201,
            name: 'Turma A - Web Development',
            code: 'WD-2025-A',
            startDate: '2025-03-01T00:00:00Z',
            endDate: '2025-06-30T00:00:00Z'
          }
        },
        {
          id: 102,
          studentId: userId,
          classId: 202,
          enrollmentDate: '2025-04-15T09:30:00Z',
          status: 'active',
          class: {
            id: 202,
            name: 'Turma B - Data Science',
            code: 'DS-2025-B',
            startDate: '2025-04-15T00:00:00Z',
            endDate: '2025-08-15T00:00:00Z'
          }
        }
      ]);
    }
    
    // Para estudantes reais
    const enrollments = await storage.getClassEnrollmentsByStudent(userId);
    
    // Enriquecer os dados com informações da turma para cada matrícula
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const classData = await storage.getClassById(enrollment.classId);
        return {
          ...enrollment,
          class: classData
        };
      })
    );
    
    res.json(enrichedEnrollments);
  } catch (error) {
    console.error('Erro ao buscar matrículas em turmas do aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar matrículas em turmas do aluno' });
  }
});

// Obter detalhes de um curso específico do aluno
studentRouter.get('/courses/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const courseId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'ID do curso inválido' });
    }
    
    // Verificar se o aluno está matriculado no curso
    const enrollments = await storage.getEnrollmentsByStudent(userId);
    const isEnrolled = enrollments.some(e => e.courseId === courseId);
    
    if (!isEnrolled && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Você não está matriculado neste curso' });
    }
    
    // Buscar detalhes do curso
    const course = await storage.getCourseById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Em uma implementação real, buscaríamos as disciplinas do curso
    // Como o método não existe ainda, vamos retornar um array vazio
    const subjects: any[] = [];
    
    // Adicionar dados de progresso (em um sistema real, seria calculado com base no progresso do aluno)
    const progress = Math.floor(Math.random() * 100);
    
    // Retornar curso com dados adicionais
    res.json({
      ...course,
      subjects,
      progress,
      isEnrolled: true
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do curso:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do curso' });
  }
});

// Endpoint para avisos e notificações (simulado por enquanto)
studentRouter.get('/notifications', async (req: Request, res: Response) => {
  try {
    // Em uma implementação real, isso buscaria avisos do banco de dados
    // Por enquanto, estamos retornando dados simulados
    const notifications = [
      { id: 1, title: 'Avaliação disponível', course: 'Desenvolvimento Web', date: '2025-05-05', isNew: true },
      { id: 2, title: 'Material adicionado', course: 'Marketing Digital', date: '2025-05-02', isNew: true },
      { id: 3, title: 'Aula remarcada', course: 'Gestão de Projetos', date: '2025-04-30', isNew: false },
      { id: 4, title: 'Novo curso disponível', course: 'Plataforma Edunéxia', date: '2025-04-25', isNew: false },
      { id: 5, title: 'Lembrete de entrega', course: 'Design UX/UI', date: '2025-04-22', isNew: false },
    ];
    
    res.json(notifications);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// Endpoint para dados financeiros (simulado por enquanto)
studentRouter.get('/financial', async (req: Request, res: Response) => {
  try {
    // Em uma implementação real, isso buscaria dados financeiros do banco de dados
    // Por enquanto, estamos retornando dados simulados
    const financialItems = [
      { id: 1, title: 'Mensalidade Maio/2025', dueDate: '2025-05-10', amount: 299.90, status: 'pending' },
      { id: 2, title: 'Mensalidade Abril/2025', dueDate: '2025-04-10', amount: 299.90, status: 'paid' },
      { id: 3, title: 'Material Didático', dueDate: '2025-03-15', amount: 150.00, status: 'paid' },
      { id: 4, title: 'Taxa de Matrícula', dueDate: '2025-03-01', amount: 80.00, status: 'paid' },
      { id: 5, title: 'Mensalidade Março/2025', dueDate: '2025-03-10', amount: 299.90, status: 'paid' },
    ];
    
    res.json(financialItems);
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    res.status(500).json({ error: 'Erro ao buscar dados financeiros' });
  }
});

// Endpoint para obter configurações do usuário
studentRouter.get('/settings', isStudent, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar as configurações do usuário no banco de dados
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, req.user.id));

    // Se não encontrar configurações, criar configurações padrão
    if (!settings) {
      const defaultSettings = {
        userId: req.user.id,
        theme: 'system',
        language: 'pt-BR',
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        twoFactorEnabled: false,
        timezone: 'America/Sao_Paulo',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm'
      };

      const [newSettings] = await db
        .insert(userSettings)
        .values(defaultSettings)
        .returning();

      return res.json(newSettings);
    }

    return res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações do usuário' });
  }
});

// Endpoint para atualizar configurações do usuário
studentRouter.put('/settings', isStudent, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const updateSchema = z.object({
      theme: z.enum(['light', 'dark', 'system']),
      language: z.string().min(1),
      emailNotifications: z.boolean(),
      smsNotifications: z.boolean(),
      pushNotifications: z.boolean(),
      twoFactorEnabled: z.boolean().default(false),
      timezone: z.string().min(1),
      dateFormat: z.string().optional(),
      timeFormat: z.string().optional()
    });

    // Validar os dados recebidos
    const validatedData = updateSchema.parse(req.body);

    // Verificar se o usuário já tem configurações
    const [existingSettings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, req.user.id));

    let updatedSettings;

    if (existingSettings) {
      // Atualizar configurações existentes
      [updatedSettings] = await db
        .update(userSettings)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(userSettings.userId, req.user.id))
        .returning();
    } else {
      // Criar novas configurações
      [updatedSettings] = await db
        .insert(userSettings)
        .values({
          userId: req.user.id,
          ...validatedData
        })
        .returning();
    }

    return res.json(updatedSettings);
  } catch (error) {
    console.error('Erro ao atualizar configurações do usuário:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erro ao atualizar configurações do usuário' });
  }
});

// Endpoint para solicitações de documentos do aluno
studentRouter.get('/document-requests', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tenantId = req.user.tenantId;
    const studentId = req.user.id;
    
    // Buscar solicitações do banco de dados
    const documentRequests = await storage.getDocumentRequestsByStudent(tenantId, studentId);
    
    // Transformar os dados para o formato esperado pelo frontend
    const formattedRequests = await Promise.all(documentRequests.map(async (request) => {
      let title = '';
      let documentUrl = undefined;
      
      // Obter o tipo de documento para pegar o título
      if (request.documentTypeId) {
        const docType = await storage.getDocumentTypeById(request.documentTypeId);
        if (docType) {
          title = docType.name;
        }
      }
      
      // Se houver documento gerado, pegar a URL
      if (request.generatedDocumentId) {
        const document = await storage.getStudentDocumentById(request.generatedDocumentId);
        if (document) {
          documentUrl = `/api/student/documents/${document.id}/download`;
        }
      }
      
      return {
        id: request.id,
        title: title || 'Documento',
        documentType: request.documentTypeId ? String(request.documentTypeId) : 'unknown',
        requestDate: request.requestDate.toISOString(),
        status: request.status,
        documentUrl: documentUrl
      };
    }));
    
    res.json(formattedRequests);
  } catch (error) {
    console.error('Erro ao buscar solicitações de documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitações de documentos' });
  }
});

// Endpoint para biblioteca de materiais
studentRouter.get('/library', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tenantId = req.user.tenantId;
    
    // Buscar materiais públicos ou associados aos cursos do aluno
    const materials = await db.select()
      .from(libraryMaterials)
      .where(
        and(
          eq(libraryMaterials.tenantId, tenantId),
          eq(libraryMaterials.isPublic, true)
        )
      )
      .orderBy(desc(libraryMaterials.createdAt));
    
    res.json(materials);
  } catch (error) {
    console.error('Erro ao buscar materiais da biblioteca:', error);
    res.status(500).json({ error: 'Erro ao buscar materiais da biblioteca' });
  }
});

// Endpoint para detalhar material da biblioteca
studentRouter.get('/library/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tenantId = req.user.tenantId;
    const materialId = parseInt(req.params.id);
    
    if (isNaN(materialId)) {
      return res.status(400).json({ error: 'ID do material inválido' });
    }
    
    // Buscar material específico
    const [material] = await db.select()
      .from(libraryMaterials)
      .where(
        and(
          eq(libraryMaterials.tenantId, tenantId),
          eq(libraryMaterials.id, materialId),
          eq(libraryMaterials.isPublic, true)
        )
      );
    
    if (!material) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }
    
    res.json(material);
  } catch (error) {
    console.error('Erro ao buscar detalhes do material:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do material' });
  }
});

// Endpoint para mensagens do aluno
studentRouter.get('/messages', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    
    // Buscar mensagens onde o aluno é o destinatário
    const receivedMessages = await db.select()
      .from(userMessages)
      .where(
        and(
          eq(userMessages.tenantId, tenantId),
          eq(userMessages.recipientId, userId)
        )
      )
      .orderBy(desc(userMessages.sentAt));
    
    // Buscar mensagens enviadas pelo aluno
    const sentMessages = await db.select()
      .from(userMessages)
      .where(
        and(
          eq(userMessages.tenantId, tenantId),
          eq(userMessages.senderId, userId)
        )
      )
      .orderBy(desc(userMessages.sentAt));
    
    // Separar mensagens em recebidas e enviadas
    res.json({
      received: receivedMessages,
      sent: sentMessages
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Endpoint para enviar uma mensagem
studentRouter.post('/messages', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tenantId = req.user.tenantId;
    const senderId = req.user.id;
    
    // Validar dados da mensagem
    const messageSchema = z.object({
      recipientId: z.number(),
      subject: z.string().min(1),
      content: z.string().min(1),
      threadId: z.number().optional()
    });
    
    const validationResult = messageSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: validationResult.error.format() });
    }
    
    const messageData = validationResult.data;
    
    // Salvar a mensagem
    const [newMessage] = await db.insert(userMessages)
      .values({
        tenantId,
        senderId,
        recipientId: messageData.recipientId,
        subject: messageData.subject,
        content: messageData.content,
        threadId: messageData.threadId,
        status: 'unread',
        sentAt: new Date()
      })
      .returning();
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Endpoint para marcar mensagem como lida
studentRouter.put('/messages/:id/read', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const messageId = parseInt(req.params.id);
    
    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'ID da mensagem inválido' });
    }
    
    // Verificar se a mensagem existe e pertence ao usuário
    const [message] = await db.select()
      .from(userMessages)
      .where(
        and(
          eq(userMessages.tenantId, tenantId),
          eq(userMessages.id, messageId),
          eq(userMessages.recipientId, userId)
        )
      );
    
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    // Atualizar status da mensagem
    await db.update(userMessages)
      .set({
        status: 'read',
        readAt: new Date()
      })
      .where(eq(userMessages.id, messageId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagem como lida' });
  }
});

// Endpoint para exportar dados do usuário (LGPD)
studentRouter.get('/export-data', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    // Buscar dados do usuário
    const userData = {
      user: req.user,
      // Aqui poderíamos adicionar mais dados do usuário como matrículas, mensagens, etc.
    };
    
    // Gerar arquivo JSON com os dados
    const dataStr = JSON.stringify(userData, null, 2);
    
    // Configurar cabeçalhos para download
    res.setHeader('Content-Disposition', 'attachment; filename=dados_pessoais.json');
    res.setHeader('Content-Type', 'application/json');
    
    // Enviar dados
    res.send(dataStr);
  } catch (error) {
    console.error('Erro ao exportar dados do usuário:', error);
    res.status(500).json({ error: 'Erro ao exportar dados do usuário' });
  }
});

// Endpoint para criar uma solicitação de documento
studentRouter.post('/document-requests', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { documentType, justification } = req.body;
    
    // Validação básica
    if (!documentType) {
      return res.status(400).json({ error: 'Tipo de documento é obrigatório' });
    }
    
    const tenantId = req.user.tenantId;
    const studentId = req.user.id;
    
    // Verificar se o tipo de documento existe
    let documentTypeId: number | undefined;
    
    // Verificar se documentType é um ID numérico ou um código de string
    if (!isNaN(Number(documentType))) {
      documentTypeId = Number(documentType);
    } else {
      // Se for string, buscar o tipo de documento pelo código
      const docType = await storage.getDocumentTypeByCode(tenantId, documentType);
      if (docType) {
        documentTypeId = docType.id;
      } else {
        // Se não encontrar, criar um tipo de documento padrão
        try {
          const newDocType = await storage.createDocumentType({
            tenantId,
            code: documentType,
            name: getDocumentTitle(documentType),
            category: 'academic'
          });
          documentTypeId = newDocType.id;
        } catch (err) {
          console.error('Erro ao criar tipo de documento:', err);
        }
      }
    }
    
    // Criar a solicitação no banco de dados
    const requestData = {
      tenantId,
      studentId,
      documentTypeId: documentTypeId || null,
      justification: justification || null,
      status: 'pending'
    };
    
    const documentRequest = await storage.createDocumentRequest(requestData);
    
    // Obter o título para retornar na resposta
    let title = '';
    if (documentTypeId) {
      const docType = await storage.getDocumentTypeById(documentTypeId);
      if (docType) {
        title = docType.name;
      }
    }
    
    // Formatar a resposta no formato esperado pelo frontend
    const formattedResponse = {
      id: documentRequest.id,
      title: title || getDocumentTitle(documentType),
      documentType: String(documentTypeId || documentType),
      justification,
      requestDate: documentRequest.requestDate.toISOString(),
      status: documentRequest.status
    };
    
    res.status(201).json(formattedResponse);
  } catch (error) {
    console.error('Erro ao criar solicitação de documento:', error);
    res.status(500).json({ error: 'Erro ao criar solicitação de documento' });
  }
});

// Endpoint para obter documentos pessoais do aluno
studentRouter.get('/personal-documents', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tenantId = req.user.tenantId;
    const studentId = req.user.id;
    
    // Buscar documentos pessoais do aluno no banco de dados
    const documents = await storage.getStudentDocumentsByStudent(tenantId, studentId);
    
    // Transformar os dados para o formato esperado pelo frontend
    const formattedDocuments = await Promise.all(documents.map(async (doc) => {
      // Obter informações do tipo de documento se disponível
      let documentTypeName = '';
      let documentTypeCode = '';
      
      if (doc.documentTypeId) {
        const docType = await storage.getDocumentTypeById(doc.documentTypeId);
        if (docType) {
          documentTypeName = docType.name;
          documentTypeCode = docType.code;
        }
      }
      
      // Converter tamanho em bytes para formato legível
      const formatFileSize = (sizeInBytes: number): string => {
        if (sizeInBytes < 1024) return `${sizeInBytes} B`;
        if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
        return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
      };
      
      return {
        id: doc.id,
        title: documentTypeName || doc.title,
        documentType: documentTypeCode || String(doc.documentTypeId) || 'document',
        uploadDate: doc.uploadDate.toISOString(),
        fileSize: formatFileSize(doc.fileSize),
        status: doc.status,
        comments: doc.comments || undefined,
        downloadUrl: `/api/student/documents/${doc.id}/download`
      };
    }));
    
    // Se não houver documentos, retornar um array vazio
    if (formattedDocuments.length === 0) {
      // Verificar se existem tipos de documentos necessários para o aluno
      const requiredDocTypes = await storage.getDocumentTypesByTenant(tenantId);
      const requiredPersonalDocs = requiredDocTypes.filter(docType => 
        docType.category === 'personal' && docType.isRequired
      );
      
      // Registrar no log que não há documentos para este aluno
      console.log(`Nenhum documento pessoal encontrado para o aluno ${studentId} (${req.user.fullName})`);
    }
    
    res.json(formattedDocuments);
  } catch (error) {
    console.error('Erro ao buscar documentos pessoais:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos pessoais' });
  }
});

// Configuração do multer para upload de arquivos

// Configurar o multer para armazenamento de arquivos
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Pasta para armazenar os documentos dos alunos
      const uploadDir = path.join(__dirname, '../uploads/student-docs');
      
      // Criar a pasta se não existir
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Criar um nome único para o arquivo usando timestamp + nome original
      const timestamp = new Date().getTime();
      const originalName = file.originalname;
      cb(null, `${timestamp}-${originalName}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Verificar se o tipo do arquivo é permitido
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Formatos permitidos: PDF, JPG, PNG, DOC, DOCX.'));
    }
  }
});

// Endpoint para upload de documento pessoal
studentRouter.post('/personal-documents', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const { documentType } = req.body;
    
    // Validação básica
    if (!documentType) {
      return res.status(400).json({ error: 'Tipo de documento é obrigatório' });
    }
    
    const tenantId = req.user.tenantId;
    const studentId = req.user.id;
    const file = req.file;
    
    // Verificar se o tipo de documento existe ou criar um novo
    let documentTypeId: number | undefined;
    let documentTitle = '';
    
    // Mapeamento de tipos de documento para títulos
    const documentTitles: Record<string, string> = {
      rg: "RG",
      cpf: "CPF",
      address_proof: "Comprovante de Endereço",
      high_school_certificate: "Certificado de Conclusão do Ensino Médio",
      graduation_diploma: "Diploma de Graduação",
      graduation_transcript: "Histórico de Graduação"
    };
    
    // Verificar se documentType é um ID numérico ou um código de string
    if (!isNaN(Number(documentType))) {
      documentTypeId = Number(documentType);
      
      // Buscar o título do tipo de documento
      const docType = await storage.getDocumentTypeById(documentTypeId);
      if (docType) {
        documentTitle = docType.name;
      }
    } else {
      // Se for string, buscar o tipo de documento pelo código
      const docType = await storage.getDocumentTypeByCode(tenantId, documentType);
      
      if (docType) {
        documentTypeId = docType.id;
        documentTitle = docType.name;
      } else {
        // Se não encontrar, criar um tipo de documento
        try {
          const newDocType = await storage.createDocumentType({
            tenantId,
            code: documentType,
            name: documentTitles[documentType] || 'Documento',
            category: 'personal'
          });
          documentTypeId = newDocType.id;
          documentTitle = newDocType.name;
        } catch (err) {
          console.error('Erro ao criar tipo de documento:', err);
        }
      }
    }
    
    // Criar o documento no banco de dados
    const studentDocument = await storage.createStudentDocument({
      tenantId,
      studentId,
      documentTypeId: documentTypeId || undefined,
      title: documentTitle || documentTitles[documentType] || 'Documento',
      filePath: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'pending'
    });
    
    // Formatar a resposta para o frontend
    const formatFileSize = (sizeInBytes: number): string => {
      if (sizeInBytes < 1024) return `${sizeInBytes} B`;
      if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    
    res.status(201).json({
      id: studentDocument.id,
      title: documentTitle || documentTitles[documentType] || 'Documento',
      documentType: documentType,
      uploadDate: studentDocument.uploadDate.toISOString(),
      fileSize: formatFileSize(file.size),
      status: studentDocument.status,
      downloadUrl: `/api/student/documents/${studentDocument.id}/download`
    });
  } catch (error) {
    console.error('Erro ao fazer upload de documento pessoal:', error);
    res.status(500).json({ error: 'Erro ao processar o upload do documento' });
  }
});

// Endpoint para download de documento
studentRouter.get('/documents/:id/download', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'ID do documento inválido' });
    }
    
    // Buscar o documento no banco de dados
    const document = await storage.getStudentDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    // Verificar se o documento pertence ao aluno ou se é admin
    if (document.studentId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este documento' });
    }
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
    }
    
    // Retornar o arquivo
    res.download(document.filePath, document.fileName);
  } catch (error) {
    console.error('Erro ao fazer download do documento:', error);
    res.status(500).json({ error: 'Erro ao processar o download do documento' });
  }
});

studentRouter.get('/library-documents', async (req: Request, res: Response) => {
  try {
    // Em uma implementação real, isso buscaria os documentos da biblioteca do banco de dados
    // Por enquanto, estamos retornando dados simulados
    const libraryDocuments = [
      {
        id: 1,
        title: 'Manual do Aluno',
        type: 'pdf',
        description: 'Guia completo com informações sobre a instituição, regras e procedimentos acadêmicos',
        uploadDate: '2025-03-15T10:00:00Z',
        downloadUrl: '#',
        fileSize: '2.4 MB'
      },
      {
        id: 2,
        title: 'Calendário Acadêmico 2025',
        type: 'pdf',
        description: 'Calendário com todas as datas importantes do ano letivo',
        uploadDate: '2025-01-05T14:30:00Z',
        downloadUrl: '#',
        fileSize: '845 KB'
      },
      {
        id: 3,
        title: 'Regimento Interno',
        type: 'pdf',
        description: 'Documento com as normas e regulamentos da instituição',
        uploadDate: '2024-12-10T09:15:00Z',
        downloadUrl: '#',
        fileSize: '1.7 MB'
      }
    ];
    
    res.json(libraryDocuments);
  } catch (error) {
    console.error('Erro ao buscar documentos da biblioteca:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos da biblioteca' });
  }
});

// Função auxiliar para obter o título do documento com base no tipo
function getDocumentTitle(documentType: string): string {
  const documentTitles: Record<string, string> = {
    'enrollment_certificate': 'Certidão de Matrícula',
    'transcript': 'Histórico Escolar',
    'enrollment_declaration': 'Declaração de Vínculo',
    'course_completion': 'Certificado de Conclusão',
    'course_content': 'Conteúdo Programático'
  };
  
  return documentTitles[documentType] || 'Outro documento';
}