import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './database-storage';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

export const adminRouter = Router();

// Middleware para verificar se o usuário é administrador
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
  }
}

// Aplicar middleware de verificação de admin em todas as rotas
adminRouter.use(isAdmin);

// Schema para validar o feedback de documento
const documentFeedbackSchema = z.object({
  comments: z.string().min(10, 'O feedback deve ter pelo menos 10 caracteres')
});

interface StudentDocument {
  id: number;
  studentId: number;
  studentName: string;
  title: string;
  documentType: string;
  uploadDate: string;
  fileSize: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  downloadUrl: string;
}

// Endpoint para listar todos os documentos pessoais dos alunos
adminRouter.get('/student-documents', async (req: Request, res: Response) => {
  try {
    // Implementar a busca real de documentos quando tiver o armazenamento adequado
    // Por ora, retornamos dados simulados
    const documents: StudentDocument[] = [
      {
        id: 1,
        studentId: 101,
        studentName: "João Silva",
        title: "RG",
        documentType: "rg",
        uploadDate: "2025-04-10T10:00:00Z",
        fileSize: "1.2 MB",
        status: "approved",
        downloadUrl: "/api/admin/student-documents/1/download"
      },
      {
        id: 2,
        studentId: 101,
        studentName: "João Silva",
        title: "Comprovante de Endereço",
        documentType: "address_proof",
        uploadDate: "2025-04-15T14:30:00Z",
        fileSize: "3.5 MB",
        status: "pending",
        downloadUrl: "/api/admin/student-documents/2/download"
      },
      {
        id: 3,
        studentId: 102,
        studentName: "Maria Oliveira",
        title: "Certificado de Conclusão do Ensino Médio",
        documentType: "high_school_certificate",
        uploadDate: "2025-04-18T09:15:00Z",
        fileSize: "2.8 MB",
        status: "rejected",
        comments: "Documento ilegível. Por favor, envie uma cópia mais clara.",
        downloadUrl: "/api/admin/student-documents/3/download"
      },
      {
        id: 4,
        studentId: 103,
        studentName: "Carlos Mendes",
        title: "CPF",
        documentType: "cpf",
        uploadDate: "2025-04-20T11:25:00Z",
        fileSize: "980 KB",
        status: "pending",
        downloadUrl: "/api/admin/student-documents/4/download"
      },
      {
        id: 5,
        studentId: 104,
        studentName: "Ana Beatriz",
        title: "Diploma de Graduação",
        documentType: "graduation_diploma",
        uploadDate: "2025-04-22T16:40:00Z",
        fileSize: "4.2 MB",
        status: "pending",
        downloadUrl: "/api/admin/student-documents/5/download"
      }
    ];

    return res.json(documents);
  } catch (error) {
    console.error('Erro ao buscar documentos dos alunos:', error);
    return res.status(500).json({ message: 'Erro ao buscar documentos dos alunos' });
  }
});

// Endpoint para aprovar um documento
adminRouter.post('/student-documents/:id/approve', async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    
    // Aqui você implementaria a lógica real de aprovação do documento
    // Por exemplo:
    // await storage.approveStudentDocument(documentId);
    
    return res.json({ 
      success: true, 
      message: 'Documento aprovado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao aprovar documento:', error);
    return res.status(500).json({ message: 'Erro ao aprovar documento' });
  }
});

// Endpoint para recusar um documento
adminRouter.post('/student-documents/:id/reject', async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    
    // Validar o corpo da requisição
    const validation = documentFeedbackSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: validation.error.format() 
      });
    }
    
    const { comments } = validation.data;
    
    // Aqui você implementaria a lógica real de recusa do documento
    // Por exemplo:
    // await storage.rejectStudentDocument(documentId, comments);
    
    return res.json({ 
      success: true, 
      message: 'Documento recusado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao recusar documento:', error);
    return res.status(500).json({ message: 'Erro ao recusar documento' });
  }
});

// Endpoint para baixar um documento
adminRouter.get('/student-documents/:id/download', async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    
    // Aqui você implementaria a lógica real para buscar e enviar o arquivo
    // Por ora, retornamos uma mensagem simulada
    return res.status(404).json({ 
      message: 'Funcionalidade de download em implementação' 
    });
  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    return res.status(500).json({ message: 'Erro ao baixar documento' });
  }
});