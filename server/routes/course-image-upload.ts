import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { courses } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const courseImageRouter = Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Pasta para armazenar as imagens dos cursos
    const uploadDir = path.join(__dirname, '../../uploads/courses');
    
    // Criar a pasta se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Criar um nome único para o arquivo usando UUID + extensão original
    const fileExt = path.extname(file.originalname);
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    cb(null, `course-${timestamp}-${uniqueId}${fileExt}`);
  }
});

// Configurar filtro para permitir apenas imagens
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagem inválido. Apenas JPG, PNG e WebP são permitidos.'));
  }
};

// Configurar upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

// Função para obter URL pública para um arquivo
function getPublicUrl(filepath: string): string {
  // Remove o caminho absoluto e mantém apenas o caminho relativo a uploads
  const relativePath = filepath.split('uploads/')[1];
  return `/uploads/${relativePath}`;
}

// Rota para upload de imagem de curso
courseImageRouter.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const courseId = req.body.courseId ? parseInt(req.body.courseId) : null;
    
    // Obter a URL pública do arquivo
    const publicUrl = getPublicUrl(req.file.path);

    // Se houver um ID de curso, atualizar a URL da imagem no banco de dados
    if (courseId) {
      await db.update(courses)
        .set({ imageUrl: publicUrl })
        .where(eq(courses.id, courseId));
    }

    // Retornar a URL da imagem
    res.status(200).json({ 
      message: 'Imagem enviada com sucesso',
      imageUrl: publicUrl,
      file: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error: any) {
    console.error('Erro no upload de imagem:', error);
    res.status(500).json({ 
      error: 'Erro ao processar o upload da imagem',
      details: error.message
    });
  }
});

// Rota para excluir uma imagem de curso
courseImageRouter.delete('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Verificar se o filename tem uma extensão de imagem válida para evitar exploits
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExt = path.extname(filename).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      return res.status(400).json({ error: 'Formato de arquivo inválido' });
    }
    
    // Caminho completo do arquivo
    const filePath = path.join(__dirname, '../../uploads/courses', filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    // Excluir o arquivo
    fs.unlinkSync(filePath);
    
    // Retornar sucesso
    res.status(200).json({ message: 'Imagem excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir imagem:', error);
    res.status(500).json({ 
      error: 'Erro ao excluir a imagem',
      details: error.message
    });
  }
});

export default courseImageRouter;