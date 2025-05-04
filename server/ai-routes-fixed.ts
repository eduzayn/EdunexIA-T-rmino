import { Router, Request, Response } from 'express';
import { aiService } from './services/ai-service-fixed';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { storage } from './database-storage';
import { authenticateToken } from './middleware/auth-middleware';
import { InsertAiConversation, InsertAiMessage, InsertAiGeneratedContent } from '@shared/schema';

// Configuração do multer para upload de arquivos temporários
const upload = multer({ 
  dest: 'uploads/temp/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

export const aiRouter = Router();

// Aplicar middleware de autenticação em todas as rotas da IA
aiRouter.use(authenticateToken);

/**
 * Rota para perguntas educacionais à IA
 */
aiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { question, conversationHistory, contextData } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'A pergunta é obrigatória' });
    }

    const response = await aiService.answerEducationalQuestion(
      question,
      conversationHistory || [],
      contextData
    );

    res.json(response);
  } catch (error: any) {
    console.error('Erro ao processar pergunta:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar sua pergunta' });
  }
});

/**
 * Rota para analisar textos educacionais
 */
aiRouter.post('/analyze-text', async (req: Request, res: Response) => {
  try {
    const { text, instruction } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'O texto para análise é obrigatório' });
    }

    const response = await aiService.analyzeText(
      text,
      instruction || 'Analise este texto e forneça insights pedagógicos.'
    );

    res.json(response);
  } catch (error: any) {
    console.error('Erro ao analisar texto:', error);
    res.status(500).json({ error: error.message || 'Erro ao analisar o texto' });
  }
});

/**
 * Rota para gerar conteúdo educacional
 */
aiRouter.post('/generate-content', async (req: Request, res: Response) => {
  try {
    const { topic, type, parameters } = req.body;

    if (!topic || !type) {
      return res.status(400).json({ error: 'Tópico e tipo são obrigatórios' });
    }

    const response = await aiService.generateEducationalContent(
      topic,
      type,
      parameters || {}
    );

    res.json(response);
  } catch (error: any) {
    console.error('Erro ao gerar conteúdo:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar conteúdo educacional' });
  }
});

/**
 * Rota para analisar imagens
 */
aiRouter.post('/analyze-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
    }

    const filePath = req.file.path;
    const prompt = req.body.prompt || '';

    // Lê o arquivo como buffer e converte para base64
    const imageBuffer = await readFileAsync(filePath);
    const base64Image = imageBuffer.toString('base64');

    // Processa a imagem na IA
    const result = await aiService.analyzeImage(base64Image, prompt);

    // Remove o arquivo temporário
    await unlinkAsync(filePath);

    res.json(result);
  } catch (error: any) {
    // Se houver um arquivo temporário, tenta removê-lo
    if (req.file && req.file.path) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo temporário:', unlinkError);
      }
    }

    console.error('Erro ao analisar imagem:', error);
    res.status(500).json({ error: error.message || 'Erro ao analisar a imagem' });
  }
});

/**
 * Rota para obter configurações atuais da IA
 */
aiRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const tenantId = user.tenantId;
    const settings = await storage.getAiSettingsByTenant(tenantId);
    
    if (settings) {
      return res.json(settings);
    }
    
    // Se não existirem configurações, criar com valores padrão
    const defaultSettings = await storage.createOrUpdateAiSettings(tenantId, {
      assistantName: 'Prof. Ana',
      defaultModel: 'claude-3-7-sonnet-20250219',
      maxTokensPerRequest: 2048,
      enabledFeatures: ['chat', 'contentGeneration', 'textAnalysis', 'imageAnalysis'],
      customInstructions: 'Atue como uma assistente educacional focada no contexto brasileiro.'
    });
    
    res.json(defaultSettings);
  } catch (error: any) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter configurações da IA' });
  }
});

/**
 * Rota para atualizar configurações da IA
 */
aiRouter.post('/settings', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const tenantId = user.tenantId;
    const { assistantName, customInstructions, enabledFeatures, defaultModel, maxTokensPerRequest } = req.body;
    
    // Atualizar configurações no banco de dados
    const updatedSettings = await storage.createOrUpdateAiSettings(tenantId, {
      assistantName, 
      customInstructions,
      enabledFeatures,
      defaultModel,
      maxTokensPerRequest
    });
    
    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      settings: updatedSettings
    });
  } catch (error: any) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar configurações da IA' });
  }
});

/**
 * Rota para adicionar documentos à base de conhecimento da IA
 */
aiRouter.post('/knowledge-base', upload.single('document'), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum documento fornecido' });
    }

    const { title, description, category } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Título do documento é obrigatório' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;

    // Criar diretório para uploads se não existir
    const uploadDir = path.join('uploads', 'knowledge-base');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Mover o arquivo para um local permanente
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const newPath = path.join(uploadDir, uniqueFileName);
    fs.renameSync(filePath, newPath);
    
    // Ler o conteúdo do arquivo
    let content = '';
    try {
      const buffer = await readFileAsync(newPath);
      if (fileType.includes('text')) {
        content = buffer.toString('utf-8');
      } else {
        // Para outros tipos de arquivo, poderíamos usar bibliotecas como pdf-parse, docx2html, etc.
        content = `Arquivo binário ${fileName} adicionado à base de conhecimento.`;
      }
    } catch (err) {
      console.error('Erro ao ler conteúdo do arquivo:', err);
      content = 'Não foi possível extrair o conteúdo deste arquivo.';
    }
    
    // Salvar no banco de dados
    const knowledgeEntry = await storage.createAiKnowledgeBase({
      tenantId: user.tenantId,
      userId: user.id,
      title,
      description: description || '',
      category: category || 'general',
      content,
      fileName,
      fileSize,
      fileType,
      filePath: newPath
    });

    res.json({
      success: true,
      message: 'Documento adicionado à base de conhecimento',
      document: knowledgeEntry
    });
  } catch (error: any) {
    // Se houver um arquivo temporário, tenta removê-lo
    if (req.file && req.file.path) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo temporário:', unlinkError);
      }
    }

    console.error('Erro ao adicionar documento:', error);
    res.status(500).json({ error: error.message || 'Erro ao adicionar documento à base de conhecimento' });
  }
});

/**
 * Rota para obter documentos da base de conhecimento
 */
aiRouter.get('/knowledge-base', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const tenantId = user.tenantId;
    const category = req.query.category as string;
    
    let documents;
    if (category) {
      documents = await storage.getAiKnowledgeBaseByCategory(tenantId, category);
    } else {
      documents = await storage.getAiKnowledgeBaseByTenant(tenantId);
    }
    
    res.json({
      documents
    });
  } catch (error: any) {
    console.error('Erro ao obter documentos:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter documentos da base de conhecimento' });
  }
});

/**
 * Rota para remover documento da base de conhecimento
 */
aiRouter.delete('/knowledge-base/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const documentId = parseInt(req.params.id);
    
    if (!documentId) {
      return res.status(400).json({ error: 'ID do documento é obrigatório' });
    }
    
    // Verificar se o documento existe e pertence ao tenant do usuário
    const document = await storage.getAiKnowledgeBaseById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    if (document.tenantId !== user.tenantId) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        message: 'Você não tem permissão para acessar este documento' 
      });
    }
    
    // Excluir o arquivo físico
    if (document.filePath && fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (unlinkError) {
        console.error('Erro ao excluir arquivo físico:', unlinkError);
      }
    }
    
    // Excluir do banco de dados
    const success = await storage.deleteAiKnowledgeBase(documentId);
    
    if (!success) {
      return res.status(500).json({ error: 'Erro ao excluir documento do banco de dados' });
    }
    
    res.json({
      success: true,
      message: 'Documento removido com sucesso',
      documentId
    });
  } catch (error: any) {
    console.error('Erro ao remover documento:', error);
    res.status(500).json({ error: error.message || 'Erro ao remover documento da base de conhecimento' });
  }
});