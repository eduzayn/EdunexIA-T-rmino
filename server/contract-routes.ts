import { Router } from 'express';
import { storage } from './database-storage';
import { contractService } from './services/contract-service';

// Middleware para autenticação
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const router = Router();

// Rota para listar contratos educacionais por tenant
router.get('/contracts', isAuthenticated, async (req, res) => {
  try {
    // Obter tenantId do usuário autenticado ou da query
    let tenantId: number | undefined;
    
    if (req.query.tenantId && req.query.tenantId !== 'undefined' && req.query.tenantId !== 'null') {
      tenantId = Number(req.query.tenantId);
    } else if (req.user && (req.user as any).tenantId) {
      tenantId = (req.user as any).tenantId;
    } else {
      return res.status(400).json({ error: 'Tenant ID é obrigatório' });
    }
    
    const contracts = await contractService.getContractsByTenant(tenantId);
    return res.json(contracts);
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    return res.status(500).json({ error: 'Erro ao listar contratos' });
  }
});

// Rota para obter contrato por ID
router.get('/contracts/:id', isAuthenticated, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const contract = await storage.getEducationalContractById(id);
    
    if (!contract) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    return res.json(contract);
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    return res.status(500).json({ error: 'Erro ao buscar contrato' });
  }
});

// Rota para listar contratos por estudante
router.get('/contracts/student/:studentId', isAuthenticated, async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const contracts = await contractService.getContractsByStudent(studentId);
    return res.json(contracts);
  } catch (error) {
    console.error('Erro ao listar contratos por estudante:', error);
    return res.status(500).json({ error: 'Erro ao listar contratos' });
  }
});

// Rota para listar contratos por curso
router.get('/contracts/course/:courseId', isAuthenticated, async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const contracts = await contractService.getContractsByCourse(courseId);
    return res.json(contracts);
  } catch (error) {
    console.error('Erro ao listar contratos por curso:', error);
    return res.status(500).json({ error: 'Erro ao listar contratos' });
  }
});

// Rota para atualizar status do contrato (assinado, cancelado, etc)
router.patch('/contracts/:id/status', isAuthenticated, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    // Verificar se é um status válido
    if (!['pending', 'signed', 'expired', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    await contractService.updateContractStatus(id, status);
    
    const updatedContract = await storage.getEducationalContractById(id);
    return res.json(updatedContract);
  } catch (error) {
    console.error('Erro ao atualizar status do contrato:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Rota para gerar contrato para uma matrícula simplificada existente
router.post('/contracts/generate-from-enrollment/:enrollmentId', isAuthenticated, async (req, res) => {
  try {
    const enrollmentId = Number(req.params.enrollmentId);
    
    // Verificar se a matrícula existe
    const enrollment = await storage.getSimplifiedEnrollmentById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }
    
    // Gerar contrato
    const contractId = await contractService.generateContractFromSimplifiedEnrollment(enrollmentId);
    
    // Retornar o contrato gerado
    const contract = await storage.getEducationalContractById(contractId);
    return res.status(201).json(contract);
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    return res.status(500).json({ error: 'Erro ao gerar contrato' });
  }
});

export default router;