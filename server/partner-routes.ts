import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './database-storage';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const partnerRouter = Router();

// Middleware para verificar se o usuário é um parceiro
function isPartner(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === 'certification_partner') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado. É necessário ser um parceiro para acessar este recurso.' });
  }
}

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads/student-docs');
      
      // Cria o diretório se não existir
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Cria um nome único para o arquivo usando timestamp + nome original
      const timestamp = new Date().getTime();
      const originalName = file.originalname;
      cb(null, `${timestamp}-${originalName}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Verifica se o tipo do arquivo é permitido
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

// Interface para documentos de alunos
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

// Interface para solicitações de certificação
interface CertificationRequest {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  certificateUrl?: string;
}

// Rota para obter estudantes associados ao parceiro
partnerRouter.get('/students', isPartner, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const students = await storage.getStudentsByTenant(tenantId);
    
    res.json(students);
  } catch (error: any) {
    console.error('Erro ao buscar estudantes:', error);
    res.status(500).json({ error: 'Erro ao buscar estudantes.' });
  }
});

// Rota para obter cursos disponíveis para o parceiro
partnerRouter.get('/courses', isPartner, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const courses = await storage.getCoursesByTenant(tenantId);
    
    res.json(courses);
  } catch (error: any) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro ao buscar cursos.' });
  }
});

// Rota para obter documentos de alunos submetidos pelo parceiro
partnerRouter.get('/student-documents', isPartner, async (req: Request, res: Response) => {
  try {
    // Dados de exemplo - em um ambiente real, buscaríamos do banco de dados
    // com base no ID do parceiro (req.user!.id)
    const mockDocuments: StudentDocument[] = [
      {
        id: 1,
        studentId: 101,
        studentName: "João Silva",
        title: "Documento de Identidade",
        documentType: "identity",
        uploadDate: "2025-04-20T10:30:00Z",
        fileSize: "1.2 MB",
        status: "approved",
        downloadUrl: "/api/partner/student-documents/1/download"
      },
      {
        id: 2,
        studentId: 102,
        studentName: "Maria Oliveira",
        title: "Comprovante de Endereço",
        documentType: "address",
        uploadDate: "2025-04-22T14:45:00Z",
        fileSize: "856 KB",
        status: "pending",
        downloadUrl: "/api/partner/student-documents/2/download"
      },
      {
        id: 3,
        studentId: 103,
        studentName: "Pedro Santos",
        title: "Diploma",
        documentType: "diploma",
        uploadDate: "2025-04-25T09:15:00Z",
        fileSize: "2.3 MB",
        status: "rejected",
        comments: "Documento ilegível. Por favor, reenvie em melhor qualidade.",
        downloadUrl: "/api/partner/student-documents/3/download"
      }
    ];
    
    res.json(mockDocuments);
  } catch (error: any) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos de alunos.' });
  }
});

// Rota para enviar documento de aluno
partnerRouter.post('/student-documents', isPartner, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { studentId, documentType, comments } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }
    
    if (!studentId || !documentType) {
      return res.status(400).json({ error: 'Dados incompletos. Informe o aluno e o tipo de documento.' });
    }
    
    // Em um ambiente real, salvaríamos os metadados do documento no banco de dados
    // e associaríamos ao aluno e parceiro correspondentes.
    // Também salvaríamos o caminho do arquivo ou o upload para um serviço de armazenamento.
    
    res.status(201).json({ 
      message: 'Documento enviado com sucesso',
      document: {
        id: Date.now(),
        studentId: Number(studentId),
        documentType,
        comments,
        fileName: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadDate: new Date().toISOString(),
        status: 'pending'
      }
    });
  } catch (error: any) {
    console.error('Erro ao enviar documento:', error);
    res.status(500).json({ error: 'Erro ao enviar documento.' });
  }
});

// Rota para baixar documento
partnerRouter.get('/student-documents/:id/download', isPartner, async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    
    // Em um ambiente real, buscaríamos o caminho do arquivo no banco de dados
    // e verificaríamos se o parceiro tem permissão para acessá-lo
    
    // Simulação - retornando um arquivo PDF de exemplo
    const filePath = path.join(__dirname, '../uploads/sample.pdf');
    
    // Se o arquivo não existir, cria um arquivo de exemplo
    if (!fs.existsSync(filePath)) {
      // Essa é apenas uma simulação - em ambiente real, retornaríamos erro se o arquivo não existir
      res.status(404).json({ error: 'Documento não encontrado' });
      return;
    }
    
    res.download(filePath, `documento-${documentId}.pdf`);
  } catch (error: any) {
    console.error('Erro ao baixar documento:', error);
    res.status(500).json({ error: 'Erro ao baixar documento.' });
  }
});

// Rota para obter estudantes elegíveis para certificação
partnerRouter.get('/eligible-students', isPartner, async (req: Request, res: Response) => {
  try {
    // Em um ambiente real, buscaríamos os alunos que tenham toda documentação aprovada
    // Dados de exemplo
    const eligibleStudents = [
      {
        id: 101,
        fullName: "João Silva",
        email: "joao.silva@exemplo.com"
      },
      {
        id: 102,
        fullName: "Maria Oliveira",
        email: "maria.oliveira@exemplo.com"
      },
      {
        id: 104,
        fullName: "Ana Souza",
        email: "ana.souza@exemplo.com"
      }
    ];
    
    res.json(eligibleStudents);
  } catch (error: any) {
    console.error('Erro ao buscar alunos elegíveis:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos elegíveis para certificação.' });
  }
});

// Rota para obter solicitações de certificação
partnerRouter.get('/certification-requests', isPartner, async (req: Request, res: Response) => {
  try {
    // Dados de exemplo
    const requests: CertificationRequest[] = [
      {
        id: 1,
        studentId: 101,
        studentName: "João Silva",
        courseId: 201,
        courseName: "Desenvolvimento Web com React",
        requestDate: "2025-04-15T10:30:00Z",
        status: "approved",
        certificateUrl: "/api/partner/certificates/101-201"
      },
      {
        id: 2,
        studentId: 102,
        studentName: "Maria Oliveira",
        courseId: 202,
        courseName: "Python para Ciência de Dados",
        requestDate: "2025-04-22T14:45:00Z",
        status: "pending"
      },
      {
        id: 3,
        studentId: 104,
        studentName: "Ana Souza",
        courseId: 203,
        courseName: "UX/UI Design",
        requestDate: "2025-04-25T09:15:00Z",
        status: "rejected",
        comments: "Documentação incompleta. Falta histórico escolar."
      }
    ];
    
    res.json(requests);
  } catch (error: any) {
    console.error('Erro ao buscar solicitações de certificação:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitações de certificação.' });
  }
});

// Rota para criar uma solicitação de certificação
partnerRouter.post('/certification-requests', isPartner, async (req: Request, res: Response) => {
  try {
    const { courseId, studentIds, comments } = req.body;
    
    if (!courseId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Dados incompletos. Informe o curso e pelo menos um aluno.' });
    }
    
    // Em um ambiente real, criaríamos a solicitação no banco de dados
    // e verificaríamos se os alunos estão elegíveis (com documentação aprovada)
    
    res.status(201).json({ 
      message: 'Solicitação de certificação enviada com sucesso',
      requestId: Date.now(),
      courseId,
      studentIds,
      comments,
      status: 'pending',
      requestDate: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro ao criar solicitação de certificação:', error);
    res.status(500).json({ error: 'Erro ao criar solicitação de certificação.' });
  }
});