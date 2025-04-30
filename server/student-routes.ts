import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './database-storage';
import { z } from 'zod';

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
studentRouter.get('/courses', isStudent, async (req: Request, res: Response) => {
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
studentRouter.get('/class-enrollments', isStudent, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    // Se for admin, retornar dados simulados para teste
    if (req.user?.role === 'admin') {
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
studentRouter.get('/courses/:id', isStudent, async (req: Request, res: Response) => {
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
studentRouter.get('/notifications', isStudent, async (req: Request, res: Response) => {
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
studentRouter.get('/financial', isStudent, async (req: Request, res: Response) => {
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

// Endpoint para solicitações de documentos do aluno (simulado por enquanto)
studentRouter.get('/document-requests', isStudent, async (req: Request, res: Response) => {
  try {
    // Em uma implementação real, isso buscaria as solicitações de documentos do banco de dados
    // Por enquanto, estamos retornando dados simulados
    const documentRequests = [
      { 
        id: 1, 
        title: 'Certidão de Matrícula', 
        documentType: 'enrollment_certificate', 
        requestDate: '2025-04-20T10:00:00Z', 
        status: 'completed', 
        documentUrl: '#' 
      },
      { 
        id: 2, 
        title: 'Histórico Escolar', 
        documentType: 'transcript', 
        requestDate: '2025-04-25T14:30:00Z', 
        status: 'pending' 
      },
      { 
        id: 3, 
        title: 'Declaração de Vínculo', 
        documentType: 'enrollment_declaration', 
        requestDate: '2025-04-28T09:15:00Z', 
        status: 'processing' 
      }
    ];
    
    res.json(documentRequests);
  } catch (error) {
    console.error('Erro ao buscar solicitações de documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitações de documentos' });
  }
});

// Endpoint para criar uma solicitação de documento (simulado por enquanto)
studentRouter.post('/document-requests', isStudent, async (req: Request, res: Response) => {
  try {
    const { documentType, justification } = req.body;
    
    // Validação básica
    if (!documentType) {
      return res.status(400).json({ error: 'Tipo de documento é obrigatório' });
    }
    
    // Em uma implementação real, isso salvaria a solicitação no banco de dados
    // e retornaria o objeto criado
    
    // Simular um atraso para parecer uma operação real
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.status(201).json({
      id: Math.floor(Math.random() * 1000) + 10,
      title: getDocumentTitle(documentType),
      documentType,
      justification,
      requestDate: new Date().toISOString(),
      status: 'pending'
    });
  } catch (error) {
    console.error('Erro ao criar solicitação de documento:', error);
    res.status(500).json({ error: 'Erro ao criar solicitação de documento' });
  }
});

// Endpoint para documentos da biblioteca (simulado por enquanto)
studentRouter.get('/library-documents', isStudent, async (req: Request, res: Response) => {
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