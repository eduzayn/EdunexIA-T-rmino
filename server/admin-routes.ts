import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './database-storage';
import { z } from 'zod';

export const adminRouter = Router();

// As verificações de administrador já são feitas no routes.ts

// Interface para solicitações de certificação
interface CertificationRequest {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  partnerName: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  certificateUrl?: string;
  documents?: any[];
}

// Endpoint para listar todas as solicitações de certificação
adminRouter.get('/partner-certifications', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'ID do tenant não encontrado' });
    }
    
    // Em um ambiente real, buscaria as solicitações de certificação
    // Aqui usamos dados mockados
    const certificationRequests = [
      {
        id: 1,
        studentId: 101,
        studentName: "João Silva",
        courseId: 201,
        courseName: "Desenvolvimento Web com React",
        partnerName: "Instituto Tecnológico ABC",
        requestDate: "2025-04-15T10:30:00Z",
        status: "approved",
        certificateUrl: "/api/admin/certificates/101-201"
      },
      {
        id: 2,
        studentId: 102,
        studentName: "Maria Oliveira",
        courseId: 202,
        courseName: "Python para Ciência de Dados",
        partnerName: "Instituto Tecnológico ABC",
        requestDate: "2025-04-22T14:45:00Z",
        status: "pending"
      }
    ];
    return res.json(certificationRequests);
  } catch (error) {
    console.error('Erro ao buscar solicitações de certificação:', error);
    return res.status(500).json({ message: 'Erro ao buscar solicitações de certificação' });
  }
});

// Endpoint para aprovar uma solicitação de certificação
adminRouter.post('/partner-certifications/:id/approve', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const approverId = req.user?.id;
    
    if (!approverId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'ID da solicitação inválido' });
    }
    
    // Aprovar a solicitação de certificação (simulação)
    const result = { studentId: 101, courseId: 201 };
    
    return res.json({ 
      success: true, 
      message: 'Solicitação de certificação aprovada com sucesso',
      certificateUrl: `/api/certificates/${result.studentId}/${result.courseId}` 
    });
  } catch (error) {
    console.error('Erro ao aprovar solicitação de certificação:', error);
    return res.status(500).json({ message: 'Erro ao aprovar solicitação' });
  }
});

// Endpoint para rejeitar uma solicitação de certificação
adminRouter.post('/partner-certifications/:id/reject', async (req: Request, res: Response) => {
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
    
    // Validar comentários (obrigatórios para rejeição)
    if (!comments || comments.trim() === '') {
      return res.status(400).json({ error: 'É obrigatório fornecer um motivo para a rejeição da solicitação' });
    }
    
    // Rejeitar a solicitação de certificação (simulação)
    // Em um ambiente real, faria uma chamada para o serviço de armazenamento
    
    return res.json({ 
      success: true, 
      message: 'Solicitação de certificação rejeitada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao rejeitar solicitação de certificação:', error);
    return res.status(500).json({ message: 'Erro ao rejeitar solicitação' });
  }
});