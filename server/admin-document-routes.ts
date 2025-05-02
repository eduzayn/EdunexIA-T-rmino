import { Router, Request, Response } from 'express';
import { storage } from './database-storage';
import { z } from 'zod';
import fs from 'fs';

export const adminDocumentRouter = Router();

// Middleware para verificar se o usuário é um admin
function isAdmin(req: Request, res: Response, next: Function) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
  }
  
  next();
}

// Aplicar middleware de admin em todas as rotas
adminDocumentRouter.use(isAdmin);

// Obter todos os documentos dos alunos
adminDocumentRouter.get('/student-documents', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'ID do tenant não encontrado' });
    }
    
    // Buscar documentos do banco de dados
    const documents = await storage.getAllStudentDocuments(tenantId);
    
    // Adicionar informações adicionais (como nome do aluno e tipo de documento)
    const enrichedDocuments = await Promise.all(documents.map(async (doc) => {
      let studentName = '';
      let documentTypeName = '';
      
      // Obter nome do aluno
      if (doc.studentId) {
        const student = await storage.getUser(doc.studentId);
        if (student) {
          studentName = student.fullName;
        }
      }
      
      // Obter nome do tipo de documento
      if (doc.documentTypeId) {
        const docType = await storage.getDocumentTypeById(doc.documentTypeId);
        if (docType) {
          documentTypeName = docType.name;
        }
      }
      
      // Retornar documento com informações adicionais
      return {
        ...doc,
        studentName,
        documentTypeName
      };
    }));
    
    res.json(enrichedDocuments);
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos' });
  }
});

// Obter todas as solicitações de documentos
adminDocumentRouter.get('/document-requests', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'ID do tenant não encontrado' });
    }
    
    // Buscar solicitações do banco de dados
    const requests = await storage.getAllDocumentRequests(tenantId);
    
    // Adicionar informações adicionais
    const enrichedRequests = await Promise.all(requests.map(async (req) => {
      let studentName = '';
      let documentTypeName = '';
      
      // Obter nome do aluno
      if (req.studentId) {
        const student = await storage.getUser(req.studentId);
        if (student) {
          studentName = student.fullName;
        }
      }
      
      // Obter nome do tipo de documento
      if (req.documentTypeId) {
        const docType = await storage.getDocumentTypeById(req.documentTypeId);
        if (docType) {
          documentTypeName = docType.name;
        }
      }
      
      // Retornar solicitação com informações adicionais
      return {
        ...req,
        studentName,
        documentTypeName
      };
    }));
    
    res.json(enrichedRequests);
  } catch (error) {
    console.error('Erro ao buscar solicitações de documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitações de documentos' });
  }
});

// Obter todos os tipos de documentos
adminDocumentRouter.get('/document-types', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'ID do tenant não encontrado' });
    }
    
    // Buscar tipos de documentos do banco de dados
    const documentTypes = await storage.getDocumentTypesByTenant(tenantId);
    res.json(documentTypes);
  } catch (error) {
    console.error('Erro ao buscar tipos de documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar tipos de documentos' });
  }
});

// Aprovar um documento
adminDocumentRouter.post('/student-documents/:id/approve', async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const { comments } = req.body;
    const reviewerId = req.user?.id;
    
    if (!reviewerId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'ID do documento inválido' });
    }
    
    // Verificar se o documento existe
    const document = await storage.getStudentDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    // Aprovar documento
    const updatedDocument = await storage.updateStudentDocumentStatus(
      documentId,
      'approved',
      reviewerId,
      comments
    );
    
    res.json(updatedDocument);
  } catch (error) {
    console.error('Erro ao aprovar documento:', error);
    res.status(500).json({ error: 'Erro ao aprovar documento' });
  }
});

// Rejeitar um documento
adminDocumentRouter.post('/student-documents/:id/reject', async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const { comments } = req.body;
    const reviewerId = req.user?.id;
    
    if (!reviewerId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'ID do documento inválido' });
    }
    
    // Validar comentários (obrigatórios para rejeição)
    if (!comments || comments.trim() === '') {
      return res.status(400).json({ error: 'É obrigatório fornecer um motivo para a rejeição do documento' });
    }
    
    // Verificar se o documento existe
    const document = await storage.getStudentDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    // Rejeitar documento
    const updatedDocument = await storage.updateStudentDocumentStatus(
      documentId,
      'rejected',
      reviewerId,
      comments
    );
    
    res.json(updatedDocument);
  } catch (error) {
    console.error('Erro ao rejeitar documento:', error);
    res.status(500).json({ error: 'Erro ao rejeitar documento' });
  }
});

// Download de um documento
adminDocumentRouter.get('/student-documents/:id/download', async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'ID do documento inválido' });
    }
    
    // Buscar documento
    const document = await storage.getStudentDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
    }
    
    // Enviar o arquivo para download
    res.download(document.filePath, document.fileName);
  } catch (error) {
    console.error('Erro ao fazer download do documento:', error);
    res.status(500).json({ error: 'Erro ao processar o download do documento' });
  }
});

// Processar uma solicitação de documento (alterar status para 'processing')
adminDocumentRouter.post('/document-requests/:id/process', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const { comments } = req.body;
    const reviewerId = req.user?.id;
    
    if (!reviewerId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'ID da solicitação inválido' });
    }
    
    // Verificar se a solicitação existe
    const request = await storage.getDocumentRequestById(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    
    // Atualizar status da solicitação para 'processing'
    const updatedRequest = await storage.updateDocumentRequestStatus(
      requestId,
      'processing',
      reviewerId,
      comments
    );
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Completar uma solicitação de documento e vincular a um documento gerado
adminDocumentRouter.post('/document-requests/:id/complete', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const { documentId, comments } = req.body;
    const reviewerId = req.user?.id;
    
    if (!reviewerId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'ID da solicitação inválido' });
    }
    
    if (!documentId || isNaN(Number(documentId))) {
      return res.status(400).json({ error: 'É necessário fornecer o ID do documento gerado' });
    }
    
    // Verificar se a solicitação existe
    const request = await storage.getDocumentRequestById(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    
    // Verificar se o documento existe
    const document = await storage.getStudentDocumentById(Number(documentId));
    
    if (!document) {
      return res.status(404).json({ error: 'Documento gerado não encontrado' });
    }
    
    // Atualizar status da solicitação e vincular ao documento
    await storage.updateDocumentRequestStatus(
      requestId,
      'completed',
      reviewerId,
      comments
    );
    
    const updatedRequest = await storage.linkGeneratedDocument(requestId, Number(documentId));
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Erro ao completar solicitação:', error);
    res.status(500).json({ error: 'Erro ao completar solicitação' });
  }
});

// Criar um novo tipo de documento
adminDocumentRouter.post('/document-types', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
      code: z.string().min(2, 'Código deve ter pelo menos 2 caracteres'),
      category: z.string(),
      description: z.string().optional(),
      isRequired: z.boolean().optional(),
      isActive: z.boolean().optional()
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }
    
    const data = result.data;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'ID do tenant não encontrado' });
    }
    
    // Verificar se já existe um tipo de documento com o mesmo código
    const existingType = await storage.getDocumentTypeByCode(tenantId, data.code);
    
    if (existingType) {
      return res.status(400).json({ error: 'Já existe um tipo de documento com este código' });
    }
    
    // Criar tipo de documento
    const documentType = await storage.createDocumentType({
      ...data,
      tenantId
    });
    
    res.status(201).json(documentType);
  } catch (error) {
    console.error('Erro ao criar tipo de documento:', error);
    res.status(500).json({ error: 'Erro ao criar tipo de documento' });
  }
});

// Atualizar um tipo de documento
adminDocumentRouter.put('/document-types/:id', async (req: Request, res: Response) => {
  try {
    const documentTypeId = parseInt(req.params.id);
    
    if (isNaN(documentTypeId)) {
      return res.status(400).json({ error: 'ID do tipo de documento inválido' });
    }
    
    const schema = z.object({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
      code: z.string().min(2, 'Código deve ter pelo menos 2 caracteres').optional(),
      category: z.string().optional(),
      description: z.string().optional().nullable(),
      isRequired: z.boolean().optional(),
      isActive: z.boolean().optional()
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }
    
    const data = result.data;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'ID do tenant não encontrado' });
    }
    
    // Verificar se o tipo de documento existe
    const documentType = await storage.getDocumentTypeById(documentTypeId);
    
    if (!documentType) {
      return res.status(404).json({ error: 'Tipo de documento não encontrado' });
    }
    
    // Verificar se o tipo de documento pertence ao tenant do usuário
    if (documentType.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar este tipo de documento' });
    }
    
    // Se estiver tentando atualizar o código, verificar se já existe outro tipo com o mesmo código
    if (data.code && data.code !== documentType.code) {
      const existingType = await storage.getDocumentTypeByCode(tenantId, data.code);
      
      if (existingType && existingType.id !== documentTypeId) {
        return res.status(400).json({ error: 'Já existe um tipo de documento com este código' });
      }
    }
    
    // Atualizar tipo de documento
    const updatedDocumentType = await storage.updateDocumentType(documentTypeId, data);
    
    res.json(updatedDocumentType);
  } catch (error) {
    console.error('Erro ao atualizar tipo de documento:', error);
    res.status(500).json({ error: 'Erro ao atualizar tipo de documento' });
  }
});

// Deletar um tipo de documento
adminDocumentRouter.delete('/document-types/:id', async (req: Request, res: Response) => {
  try {
    const documentTypeId = parseInt(req.params.id);
    
    if (isNaN(documentTypeId)) {
      return res.status(400).json({ error: 'ID do tipo de documento inválido' });
    }
    
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'ID do tenant não encontrado' });
    }
    
    // Verificar se o tipo de documento existe
    const documentType = await storage.getDocumentTypeById(documentTypeId);
    
    if (!documentType) {
      return res.status(404).json({ error: 'Tipo de documento não encontrado' });
    }
    
    // Verificar se o tipo de documento pertence ao tenant do usuário
    if (documentType.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este tipo de documento' });
    }
    
    // Verificar se existem documentos ou solicitações usando este tipo
    const documents = await storage.getStudentDocumentsByType(tenantId, documentTypeId);
    const requests = await storage.getDocumentRequestsByType(tenantId, documentTypeId);
    
    if (documents.length > 0 || requests.length > 0) {
      // Ao invés de impedir a exclusão, vamos apenas desativar o tipo
      const updatedDocumentType = await storage.updateDocumentType(documentTypeId, { isActive: false });
      
      return res.json({ 
        message: 'O tipo de documento foi desativado pois existem documentos ou solicitações associados a ele',
        documentType: updatedDocumentType
      });
    }
    
    // Excluir tipo de documento
    await storage.deleteDocumentType(documentTypeId);
    
    res.json({ success: true, message: 'Tipo de documento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tipo de documento:', error);
    res.status(500).json({ error: 'Erro ao excluir tipo de documento' });
  }
});