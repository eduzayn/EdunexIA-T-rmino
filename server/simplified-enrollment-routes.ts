import { Router } from 'express';
import { storage } from './database-storage';
import { z } from 'zod';
import { insertSimplifiedEnrollmentSchema } from '@shared/schema';
import { paymentService } from './services/payment-service';
// Middleware para autenticação
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const router = Router();

// Schema de validação para criação de matrícula simplificada
const createEnrollmentSchema = insertSimplifiedEnrollmentSchema.extend({
  // Campos obrigatórios
  studentName: z.string().min(3, "Nome do aluno é obrigatório"),
  studentEmail: z.string().email("Email inválido"),
  studentCpf: z.string().min(11, "CPF inválido"),
  amount: z.number().min(1, "Valor precisa ser maior que zero"),
  consultantId: z.number(),
  courseId: z.number(),
  tenantId: z.number(),
  // Opcional
  installments: z.number().min(1).max(12).default(1),
  paymentMethod: z.enum(["UNDEFINED", "BOLETO", "CREDIT_CARD", "PIX"]).default("UNDEFINED"),
  studentPhone: z.string().optional(),
  poloId: z.number().optional()
});

// Rota para criar matrícula simplificada (com checkout Asaas)
router.post('/simplified-enrollments', isAuthenticated, async (req, res) => {
  try {
    // Validar dados de entrada
    const enrollmentData = createEnrollmentSchema.parse(req.body);
    
    // Buscar curso para obter título
    const course = await storage.getCourseById(enrollmentData.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Criar matrícula no banco de dados
    const enrollment = await storage.createSimplifiedEnrollment(enrollmentData);
    
    try {
      // Criar cliente no Asaas ou recuperar existente
      const customer = await paymentService.getOrCreateCustomer({
        name: enrollmentData.studentName,
        email: enrollmentData.studentEmail,
        cpfCnpj: enrollmentData.studentCpf.replace(/[^0-9]/g, ''), // Remover formatação
        phone: enrollmentData.studentPhone,
      });
      
      // Criar checkout para pagamento
      const checkout = await paymentService.createMatriculaCheckout({
        customer: customer,
        enrollmentId: enrollment.id,
        courseTitle: course.title,
        studentName: enrollmentData.studentName,
        value: enrollmentData.amount,
        installments: enrollmentData.installments
      });
      
      // Atualizar matrícula com dados do pagamento
      const updatedEnrollment = await storage.updateSimplifiedEnrollmentStatus(
        enrollment.id,
        'waiting_payment',
        {
          paymentUrl: checkout.paymentUrl,
          asaasCustomerId: customer.id,
          asaasPaymentId: checkout.paymentId,
          externalReference: `matricula-${enrollment.id}`
        }
      );
      
      return res.status(201).json(updatedEnrollment);
    } catch (paymentError: any) {
      console.error('Erro ao processar pagamento:', paymentError);
      // Mesmo com erro no pagamento, a matrícula foi criada
      // Atualizando status para falha no pagamento
      await storage.updateSimplifiedEnrollmentStatus(enrollment.id, 'failed');
      return res.status(500).json({ 
        error: 'Erro ao processar pagamento', 
        details: paymentError.message,
        enrollment: enrollment
      });
    }
  } catch (error: any) {
    console.error('Erro ao criar matrícula simplificada:', error);
    if (error.errors) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    return res.status(500).json({ error: 'Erro ao processar matrícula' });
  }
});

// Rota para listar matrículas simplificadas por tenant
router.get('/simplified-enrollments', isAuthenticated, async (req, res) => {
  try {
    const tenantId = Number(req.query.tenantId);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID é obrigatório' });
    }
    
    const enrollments = await storage.getSimplifiedEnrollmentsByTenant(tenantId);
    return res.json(enrollments);
  } catch (error) {
    console.error('Erro ao listar matrículas simplificadas:', error);
    return res.status(500).json({ error: 'Erro ao listar matrículas' });
  }
});

// Rota para obter matrícula simplificada por ID
router.get('/simplified-enrollments/:id', isAuthenticated, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const enrollment = await storage.getSimplifiedEnrollmentById(id);
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }
    
    return res.json(enrollment);
  } catch (error) {
    console.error('Erro ao buscar matrícula simplificada:', error);
    return res.status(500).json({ error: 'Erro ao buscar matrícula' });
  }
});

// Rota para listar matrículas por consultor
router.get('/simplified-enrollments/consultant/:consultantId', isAuthenticated, async (req, res) => {
  try {
    const consultantId = Number(req.params.consultantId);
    const enrollments = await storage.getSimplifiedEnrollmentsByConsultant(consultantId);
    return res.json(enrollments);
  } catch (error) {
    console.error('Erro ao listar matrículas por consultor:', error);
    return res.status(500).json({ error: 'Erro ao listar matrículas' });
  }
});

// Rota para atualizar status da matrícula
router.patch('/simplified-enrollments/:id/status', isAuthenticated, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    // Verificar se é um status válido
    if (!['pending', 'waiting_payment', 'payment_confirmed', 'completed', 'cancelled', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const updatedEnrollment = await storage.updateSimplifiedEnrollmentStatus(id, status);
    return res.json(updatedEnrollment);
  } catch (error) {
    console.error('Erro ao atualizar status da matrícula:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Webhook para receber notificações do Asaas (pagamentos confirmados, etc)
router.post('/webhooks/asaas', async (req, res) => {
  try {
    const event = req.body;
    console.log('Webhook Asaas recebido:', event);
    
    // Verificar tipo de evento
    if (event.event === 'PAYMENT_RECEIVED' || event.event === 'PAYMENT_CONFIRMED') {
      const payment = event.payment;
      
      // Extrair ID da matrícula da referência externa
      const match = payment.externalReference.match(/matricula-(\d+)/);
      if (match && match[1]) {
        const enrollmentId = Number(match[1]);
        
        // Atualizar status da matrícula
        await storage.updateSimplifiedEnrollmentStatus(enrollmentId, 'payment_confirmed');
        console.log(`Matrícula ${enrollmentId} confirmada por pagamento: ${payment.id}`);
      }
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook Asaas:', error);
    return res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export default router;