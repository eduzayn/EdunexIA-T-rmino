import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './database-storage';

export const certificateRouter = Router();

// Interface para dados do certificado
interface CertificateData {
  studentName: string;
  courseName: string;
  courseHours: number;
  startDate: string;
  endDate: string;
  institutionName: string;
  directorName: string;
  directorTitle: string;
  registrationNumber: string;
  certificateId: string;
  disciplines: Array<{
    name: string;
    teacherName: string;
    teacherTitle: string;
    hours: number;
    grade: string;
  }>;
}

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
  }
  next();
}

// Middleware para permitir acesso específico ao certificado do João Silva (para demonstração)
function allowDemoCertificate(req: Request, res: Response, next: NextFunction) {
  const { studentId, courseId } = req.params;
  
  // Permitir acesso específico ao certificado de demonstração do João Silva (101-201)
  if (studentId === '101' && courseId === '201') {
    return next();
  }
  
  // Caso contrário, verificar autenticação
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
  }
  next();
}

// Gerar dados do certificado com base no estudante e curso
async function generateCertificateData(studentId: number, courseId: number): Promise<CertificateData> {
  try {
    // Obter dados do estudante
    const student = await storage.getStudentById(studentId);
    if (!student) {
      throw new Error('Estudante não encontrado');
    }

    // Obter dados do curso (usando o tenantId do estudante para garantir isolamento)
    const course = await storage.getCourseById(courseId, student.tenantId);
    if (!course) {
      throw new Error('Curso não encontrado');
    }

    // Obter matrículas/inscrições para determinar datas
    const enrollments = await storage.getEnrollmentsByStudent(studentId);
    const courseEnrollment = enrollments.find(enrollment => enrollment.courseId === courseId);
    
    if (!courseEnrollment) {
      throw new Error('Matrícula não encontrada para este curso');
    }

    // Obter módulos do curso para calcular carga horária total
    const modules = await storage.getModulesByCourse(courseId);
    // Calcular carga horária estimada (na produção viria do banco de dados)
    const totalHours = 800; // Valor padrão de 800 horas para cursos de pós-graduação

    // Disciplinas do curso (simulação - em produção viria do banco de dados)
    const disciplines = [
      {
        name: "Fundamentos teóricos",
        teacherName: "Prof. Dr. Ricardo Prado",
        teacherTitle: "Doutor em Educação",
        hours: Math.floor(totalHours * 0.2),
        grade: "A"
      },
      {
        name: "Práticas aplicadas",
        teacherName: "Profa. Dra. Maria Silva",
        teacherTitle: "Doutora em Psicologia",
        hours: Math.floor(totalHours * 0.3),
        grade: "A"
      },
      {
        name: "Metodologia avançada",
        teacherName: "Prof. Dr. Carlos Mendes",
        teacherTitle: "Doutor em Metodologia",
        hours: Math.floor(totalHours * 0.25),
        grade: "B"
      },
      {
        name: "Estudos de caso",
        teacherName: "Profa. Dra. Ana Rocha",
        teacherTitle: "Doutora em Educação",
        hours: Math.floor(totalHours * 0.25),
        grade: "A"
      }
    ];

    // Obter dados do tenant/instituição
    const tenant = await storage.getTenantById(student.tenantId);
    const institutionName = tenant?.name || 'Faculdade Edunéxia';

    // Construir dados do certificado
    return {
      studentName: student.fullName,
      courseName: course.title,
      courseHours: totalHours,
      startDate: courseEnrollment.createdAt.toISOString(),
      endDate: courseEnrollment.completedAt ? courseEnrollment.completedAt.toISOString() : new Date().toISOString(),
      institutionName: institutionName,
      directorName: "Ana Lúcia Moreira Gonçalves",
      directorTitle: "Diretora Adjunta",
      registrationNumber: `${studentId}-${courseId}`,
      certificateId: `${studentId}-${courseId}`,
      disciplines: disciplines
    };
  } catch (error) {
    console.error('Erro ao gerar dados do certificado:', error);
    throw error;
  }
}

// Rota para obter os dados do certificado
certificateRouter.get('/:studentId/:courseId', allowDemoCertificate, async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const courseId = parseInt(req.params.courseId);

    if (isNaN(studentId) || isNaN(courseId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const certificateData = await generateCertificateData(studentId, courseId);
    return res.json(certificateData);
  } catch (error) {
    console.error('Erro ao buscar certificado:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar dados do certificado',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Verificar autenticidade do certificado (rota pública)
certificateRouter.get('/verify/:certificateId', async (req: Request, res: Response) => {
  try {
    const certificateId = req.params.certificateId;
    const [studentId, courseId] = certificateId.split('-').map(id => parseInt(id));
    
    if (isNaN(studentId) || isNaN(courseId)) {
      return res.status(400).json({ error: 'ID de certificado inválido' });
    }
    
    // Verificar se o estudante e curso existem
    const student = await storage.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Estudante não encontrado' });
    }
    
    // Usar o tenantId do estudante para garantir isolamento de dados
    const course = await storage.getCourseById(courseId, student.tenantId);
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Verificar se o estudante está matriculado no curso
    const enrollments = await storage.getEnrollmentsByStudent(studentId);
    const courseEnrollment = enrollments.find(enrollment => enrollment.courseId === courseId);
    
    if (!courseEnrollment) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }
    
    // Certificado é válido
    return res.json({
      isValid: true,
      studentName: student.fullName,
      courseName: course.title,
      issueDate: courseEnrollment.completedAt ? courseEnrollment.completedAt.toISOString() : new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar certificado:', error);
    return res.status(500).json({ error: 'Erro ao verificar certificado' });
  }
});