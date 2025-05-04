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
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const { question, conversationId, contextData } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'A pergunta é obrigatória' });
    }
    
    let conversation;
    let conversationHistory = [];
    
    // Se tiver ID de conversa, buscar mensagens anteriores
    if (conversationId) {
      conversation = await storage.getAiConversationById(parseInt(conversationId));
      
      if (conversation) {
        // Verificar se a conversa pertence ao tenant do usuário
        if (conversation.tenantId !== user.tenantId) {
          return res.status(403).json({ 
            error: 'Acesso negado', 
            message: 'Você não tem permissão para acessar esta conversa' 
          });
        }
        
        // Buscar histórico de mensagens
        const messages = await storage.getAiMessagesByConversation(conversation.id);
        
        // Formatar mensagens para o formato esperado pelo serviço de IA
        conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }
    
    // Se não tiver conversa existente, criar uma nova
    if (!conversation) {
      conversation = await storage.createAiConversation({
        tenantId: user.tenantId,
        userId: user.id,
        title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
        context: contextData ? JSON.stringify(contextData) : null
      });
    }
    
    // Salvar a mensagem do usuário
    await storage.createAiMessage({
      conversationId: conversation.id,
      role: 'user',
      content: question
    });
    
    // Obter as configurações da IA
    const settings = await storage.getAiSettingsByTenant(user.tenantId);
    const aiName = settings?.assistantName || 'Prof. Ana';
    
    // Processar a pergunta com o serviço de IA
    const response = await aiService.answerEducationalQuestion(
      question,
      conversationHistory,
      contextData
    );
    
    // Salvar a resposta da IA
    await storage.createAiMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: response.answer
    });
    
    res.json({
      ...response,
      conversationId: conversation.id
    });
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
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const { text, instruction } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'O texto para análise é obrigatório' });
    }
    
    // Obter as configurações da IA
    const settings = await storage.getAiSettingsByTenant(user.tenantId);
    
    // Processar a análise com o serviço de IA
    const response = await aiService.analyzeText(
      text,
      instruction || 'Analise este texto e forneça insights pedagógicos.'
    );
    
    // Salvar o resultado no banco de dados
    const generatedContent = await storage.createAiGeneratedContent({
      tenantId: user.tenantId,
      userId: user.id,
      contentType: 'text-analysis',
      title: instruction || 'Análise de texto',
      content: JSON.stringify({
        originalText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        analysis: response.analysis
      }),
      metadata: {
        textLength: text.length,
        instruction: instruction
      }
    });
    
    res.json({
      ...response,
      id: generatedContent.id
    });
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
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const { topic, type, parameters } = req.body;

    if (!topic || !type) {
      return res.status(400).json({ error: 'Tópico e tipo são obrigatórios' });
    }
    
    // Obter as configurações da IA
    const settings = await storage.getAiSettingsByTenant(user.tenantId);
    
    // Processar a geração de conteúdo com o serviço de IA
    const response = await aiService.generateEducationalContent(
      topic,
      type,
      parameters || {}
    );
    
    // Determinar um título apropriado para o conteúdo
    let title;
    switch(type) {
      case 'lesson':
        title = `Plano de aula: ${topic}`;
        break;
      case 'quiz':
        title = `Questionário: ${topic}`;
        break;
      case 'presentation':
        title = `Apresentação: ${topic}`;
        break;
      case 'summary':
        title = `Resumo: ${topic}`;
        break;
      default:
        title = `Conteúdo sobre: ${topic}`;
    }
    
    // Salvar o resultado no banco de dados
    const generatedContent = await storage.createAiGeneratedContent({
      tenantId: user.tenantId,
      userId: user.id,
      contentType: `generated-${type}`,
      title: title,
      content: JSON.stringify({
        topic: topic,
        type: type,
        content: response.content
      }),
      metadata: {
        parameters: parameters || {}
      }
    });
    
    res.json({
      ...response,
      id: generatedContent.id,
      title: title
    });
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
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
    }

    const filePath = req.file.path;
    const prompt = req.body.prompt || '';
    const title = req.body.title || `Análise de imagem - ${new Date().toLocaleString('pt-BR')}`;

    // Lê o arquivo como buffer e converte para base64
    const imageBuffer = await readFileAsync(filePath);
    const base64Image = imageBuffer.toString('base64');

    // Obter as configurações da IA
    const settings = await storage.getAiSettingsByTenant(user.tenantId);
    
    // Processa a imagem na IA
    const result = await aiService.analyzeImage(base64Image, prompt);

    // Criar um diretório para armazenar imagens analisadas
    const uploadDir = path.join('uploads', 'analyzed-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Mover o arquivo para um local permanente
    const fileName = req.file.originalname;
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const newPath = path.join(uploadDir, uniqueFileName);
    fs.renameSync(filePath, newPath);
    
    // Salvar o resultado no banco de dados
    const generatedContent = await storage.createAiGeneratedContent({
      tenantId: user.tenantId,
      userId: user.id,
      contentType: 'image-analysis',
      title: title,
      content: JSON.stringify({
        analysis: result.analysis,
        prompt: prompt
      }),
      metadata: {
        imageUrl: newPath,
        fileName: fileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });
    
    res.json({
      ...result,
      id: generatedContent.id,
      imageUrl: newPath,
      title: title
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

/**
 * Rota para listar conversas da IA
 */
aiRouter.get('/conversations', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const conversations = await storage.getAiConversationsByTenant(
      user.tenantId, 
      (page - 1) * limit, 
      limit
    );
    
    const count = await storage.countAiConversationsByTenant(user.tenantId);
    
    res.json({
      data: conversations,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar conversas' });
  }
});

/**
 * Rota para obter uma conversa específica e suas mensagens
 */
aiRouter.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const conversationId = parseInt(req.params.id);
    
    if (!conversationId) {
      return res.status(400).json({ error: 'ID da conversa é obrigatório' });
    }
    
    // Buscar conversa
    const conversation = await storage.getAiConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }
    
    // Verificar se a conversa pertence ao tenant do usuário
    if (conversation.tenantId !== user.tenantId) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        message: 'Você não tem permissão para acessar esta conversa' 
      });
    }
    
    // Buscar mensagens
    const messages = await storage.getAiMessagesByConversation(conversationId);
    
    res.json({
      conversation,
      messages
    });
  } catch (error: any) {
    console.error('Erro ao obter conversa:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter conversa' });
  }
});

/**
 * Rota para excluir uma conversa
 */
aiRouter.delete('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const conversationId = parseInt(req.params.id);
    
    if (!conversationId) {
      return res.status(400).json({ error: 'ID da conversa é obrigatório' });
    }
    
    // Buscar conversa
    const conversation = await storage.getAiConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }
    
    // Verificar se a conversa pertence ao tenant do usuário
    if (conversation.tenantId !== user.tenantId) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        message: 'Você não tem permissão para excluir esta conversa' 
      });
    }
    
    // Excluir as mensagens da conversa
    await storage.deleteAiMessagesByConversation(conversationId);
    
    // Excluir a conversa
    const success = await storage.deleteAiConversation(conversationId);
    
    if (!success) {
      return res.status(500).json({ error: 'Erro ao excluir conversa do banco de dados' });
    }
    
    res.json({
      success: true,
      message: 'Conversa excluída com sucesso',
      conversationId
    });
  } catch (error: any) {
    console.error('Erro ao excluir conversa:', error);
    res.status(500).json({ error: error.message || 'Erro ao excluir conversa' });
  }
});

/**
 * Rota para listar conteúdos gerados pela IA
 */
aiRouter.get('/generated-content', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const contentType = req.query.type as string || undefined;
    
    const contents = await storage.getAiGeneratedContentByTenant(
      user.tenantId,
      contentType,
      (page - 1) * limit,
      limit
    );
    
    const count = await storage.countAiGeneratedContentByTenant(user.tenantId, contentType);
    
    res.json({
      data: contents,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar conteúdos gerados:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar conteúdos gerados' });
  }
});

/**
 * Rota para obter um conteúdo gerado específico
 */
aiRouter.get('/generated-content/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const contentId = parseInt(req.params.id);
    
    if (!contentId) {
      return res.status(400).json({ error: 'ID do conteúdo é obrigatório' });
    }
    
    // Buscar conteúdo
    const content = await storage.getAiGeneratedContentById(contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }
    
    // Verificar se o conteúdo pertence ao tenant do usuário
    if (content.tenantId !== user.tenantId) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        message: 'Você não tem permissão para acessar este conteúdo' 
      });
    }
    
    res.json(content);
  } catch (error: any) {
    console.error('Erro ao obter conteúdo gerado:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter conteúdo gerado' });
  }
});

/**
 * Rota para excluir um conteúdo gerado
 */
aiRouter.delete('/generated-content/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const contentId = parseInt(req.params.id);
    
    if (!contentId) {
      return res.status(400).json({ error: 'ID do conteúdo é obrigatório' });
    }
    
    // Buscar conteúdo
    const content = await storage.getAiGeneratedContentById(contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }
    
    // Verificar se o conteúdo pertence ao tenant do usuário
    if (content.tenantId !== user.tenantId) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        message: 'Você não tem permissão para excluir este conteúdo' 
      });
    }
    
    // Se o conteúdo for do tipo análise de imagem, verificar se há um arquivo associado
    if (content.contentType === 'image-analysis' && content.metadata) {
      const metadata = content.metadata as any;
      if (metadata.imageUrl && fs.existsSync(metadata.imageUrl)) {
        try {
          fs.unlinkSync(metadata.imageUrl);
        } catch (unlinkError) {
          console.error('Erro ao excluir arquivo de imagem:', unlinkError);
        }
      }
    }
    
    // Excluir do banco de dados
    const success = await storage.deleteAiGeneratedContent(contentId);
    
    if (!success) {
      return res.status(500).json({ error: 'Erro ao excluir conteúdo do banco de dados' });
    }
    
    res.json({
      success: true,
      message: 'Conteúdo excluído com sucesso',
      contentId
    });
  } catch (error: any) {
    console.error('Erro ao excluir conteúdo:', error);
    res.status(500).json({ error: error.message || 'Erro ao excluir conteúdo gerado' });
  }
});