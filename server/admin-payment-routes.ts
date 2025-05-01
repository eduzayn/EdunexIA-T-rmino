import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db';

export const adminPaymentRouter = Router();

// Middleware para verificar se usuário é admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden - Requires Admin Role' });
  }

  next();
}

// Interface para representar um pagamento de certificação
interface PartnerPayment {
  id: number;
  partnerName: string;
  partnerId: number;
  studentName: string;
  studentId: number;
  courseName: string;
  courseId: number;
  certificationId: number;
  description: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentUrl?: string;
  receiptUrl?: string;
  transactionId?: string;
}

// Aplicar middleware de admin a todas as rotas
adminPaymentRouter.use(isAdmin);

// Obter todos os pagamentos de parceiros
adminPaymentRouter.get('/partner-payments', async (req: Request, res: Response) => {
  try {
    // Em um ambiente real, isso viria do banco de dados
    // Aqui estamos usando dados estáticos para demonstração
    const payments: PartnerPayment[] = [
      {
        id: 1,
        partnerName: "Parceiro A",
        partnerId: 1,
        studentName: "João Silva",
        studentId: 101,
        courseName: "Desenvolvimento Web com React",
        courseId: 1,
        certificationId: 1001,
        description: "Certificação: Desenvolvimento Web com React - Aluno: João Silva",
        date: "2025-04-15",
        dueDate: "2025-04-25",
        amount: 89.9,
        status: "pending",
        paymentUrl: "https://www.asaas.com/c/123456",
        transactionId: "pay_123456789"
      },
      {
        id: 2,
        partnerName: "Parceiro B",
        partnerId: 2,
        studentName: "Maria Oliveira",
        studentId: 102,
        courseName: "Python para Ciência de Dados",
        courseId: 2,
        certificationId: 1002,
        description: "Certificação: Python para Ciência de Dados - Aluno: Maria Oliveira",
        date: "2025-04-10",
        dueDate: "2025-04-20",
        amount: 89.9,
        status: "paid",
        paymentUrl: "https://www.asaas.com/c/234567",
        receiptUrl: "https://www.asaas.com/r/234567",
        transactionId: "pay_234567890"
      },
      {
        id: 3,
        partnerName: "Parceiro C",
        partnerId: 3,
        studentName: "Ana Souza",
        studentId: 103,
        courseName: "UX/UI Design",
        courseId: 3,
        certificationId: 1003,
        description: "Certificação: UX/UI Design - Aluno: Ana Souza",
        date: "2025-04-05",
        dueDate: "2025-04-15",
        amount: 89.9,
        status: "overdue",
        paymentUrl: "https://www.asaas.com/c/345678",
        transactionId: "pay_345678901"
      },
      {
        id: 4,
        partnerName: "Parceiro A",
        partnerId: 1,
        studentName: "Lote com 5 alunos",
        studentId: 0, // Representa um lote
        courseName: "Marketing Digital",
        courseId: 4,
        certificationId: 1004,
        description: "Certificação: Marketing Digital - Alunos: Lote com 5 alunos",
        date: "2025-04-01",
        dueDate: "2025-04-11",
        amount: 399.5, // 5 alunos x 79.90 (desconto para lote)
        status: "pending",
        paymentUrl: "https://www.asaas.com/c/456789",
        transactionId: "pay_456789012"
      }
    ];

    res.json(payments);
  } catch (error: any) {
    console.error('Error fetching partner payments:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar pagamentos de parceiros' });
  }
});

// Rota para obter resumo financeiro dos pagamentos
adminPaymentRouter.get('/partner-payments/summary', async (req: Request, res: Response) => {
  try {
    // Em um ambiente real, isso seria calculado a partir do banco de dados
    const summary = {
      totalReceived: 89.9, // Total de pagamentos com status "paid"
      totalPending: 489.4, // Total de pagamentos com status "pending"
      totalOverdue: 89.9, // Total de pagamentos com status "overdue"
      totalCertifications: 1, // Número de certificações pagas
      partnerDistribution: [
        { name: "Parceiro A", count: 2, amount: 489.4 },
        { name: "Parceiro B", count: 1, amount: 89.9 },
        { name: "Parceiro C", count: 1, amount: 89.9 }
      ],
      monthlySummary: [
        { month: "Jan", amount: 0 },
        { month: "Fev", amount: 0 },
        { month: "Mar", amount: 0 },
        { month: "Abr", amount: 669.2 },
        { month: "Mai", amount: 0 },
        { month: "Jun", amount: 0 }
      ]
    };

    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar resumo de pagamentos' });
  }
});

// Rota para marcar um pagamento como pago manualmente (para casos excepcionais)
adminPaymentRouter.post('/partner-payments/:id/mark-as-paid', async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    // Em um ambiente real, isso atualizaria o registro no banco de dados
    // Aqui apenas retornamos uma resposta estática
    
    res.json({
      success: true,
      message: `Pagamento #${paymentId} marcado como pago manualmente.`
    });
  } catch (error: any) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar status do pagamento' });
  }
});

// Rota para gerar/exportar relatório de pagamentos (mock)
adminPaymentRouter.get('/partner-payments/export', async (req: Request, res: Response) => {
  try {
    // Em um ambiente real, geraria um CSV ou PDF com os dados
    // Aqui apenas simulamos uma resposta
    
    res.json({
      success: true,
      message: 'Relatório gerado com sucesso',
      downloadUrl: '/api/admin/partner-payments/download-report'
    });
  } catch (error: any) {
    console.error('Error generating payment report:', error);
    res.status(500).json({ message: error.message || 'Erro ao gerar relatório de pagamentos' });
  }
});

// Em um ambiente real, esta rota retornaria o arquivo de relatório
adminPaymentRouter.get('/partner-payments/download-report', async (req: Request, res: Response) => {
  try {
    // Mock para simular o download do relatório
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_pagamentos.csv');
    
    // Cabeçalho CSV
    let csv = 'ID,Parceiro,Aluno,Curso,Data,Vencimento,Valor,Status\n';
    
    // Linhas com dados (exemplos)
    csv += '1,Parceiro A,João Silva,Desenvolvimento Web com React,15/04/2025,25/04/2025,R$ 89.90,Pendente\n';
    csv += '2,Parceiro B,Maria Oliveira,Python para Ciência de Dados,10/04/2025,20/04/2025,R$ 89.90,Pago\n';
    csv += '3,Parceiro C,Ana Souza,UX/UI Design,05/04/2025,15/04/2025,R$ 89.90,Vencido\n';
    csv += '4,Parceiro A,Lote com 5 alunos,Marketing Digital,01/04/2025,11/04/2025,R$ 399.50,Pendente\n';
    
    res.send(csv);
  } catch (error: any) {
    console.error('Error downloading payment report:', error);
    res.status(500).json({ message: error.message || 'Erro ao baixar relatório de pagamentos' });
  }
});