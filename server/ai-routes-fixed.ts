import { Router, Request, Response } from 'express';
import { aiService } from './services/ai-service-fixed';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Configuração do multer para upload de arquivos temporários
const upload = multer({ 
  dest: 'uploads/temp/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

export const aiRouter = Router();

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
aiRouter.get('/settings', (req: Request, res: Response) => {
  try {
    // Aqui implementaríamos a lógica para buscar as configurações do banco de dados
    // Por enquanto, retornamos configurações padrão
    res.json({
      assistantName: 'Prof. Ana',
      defaultModel: 'claude-3-7-sonnet-20250219',
      maxTokensPerRequest: 2048,
      enabledFeatures: ['chat', 'contentGeneration', 'textAnalysis', 'imageAnalysis'],
      customInstructions: 'Atue como uma assistente educacional focada no contexto brasileiro.'
    });
  } catch (error: any) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter configurações da IA' });
  }
});

/**
 * Rota para atualizar configurações da IA
 */
aiRouter.post('/settings', (req: Request, res: Response) => {
  try {
    const { assistantName, customInstructions, enabledFeatures } = req.body;
    
    // Aqui implementaríamos a lógica para salvar as configurações no banco de dados
    // Por enquanto, apenas simulamos uma atualização bem-sucedida
    
    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      settings: {
        assistantName: assistantName || 'Prof. Ana',
        defaultModel: 'claude-3-7-sonnet-20250219',
        enabledFeatures: enabledFeatures || ['chat', 'contentGeneration', 'textAnalysis', 'imageAnalysis'],
        customInstructions: customInstructions || 'Atue como uma assistente educacional focada no contexto brasileiro.'
      }
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

    // Aqui implementaríamos a lógica para processar o documento,
    // extrair o texto, gerar embeddings e armazená-los no banco de dados
    
    // Moveria o arquivo para um local permanente
    const newPath = path.join('uploads', 'knowledge-base', `${Date.now()}-${fileName}`);
    
    // Simula processamento bem-sucedido
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Remove o arquivo temporário
    await unlinkAsync(filePath);

    res.json({
      success: true,
      message: 'Documento adicionado à base de conhecimento',
      document: {
        id: Date.now(),
        title,
        description: description || '',
        category: category || 'general',
        fileName,
        fileSize,
        fileType,
        path: newPath,
        addedAt: new Date().toISOString()
      }
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
aiRouter.get('/knowledge-base', (req: Request, res: Response) => {
  try {
    // Aqui implementaríamos a lógica para buscar os documentos do banco de dados
    // Por enquanto, retornamos uma lista vazia
    res.json({
      documents: []
    });
  } catch (error: any) {
    console.error('Erro ao obter documentos:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter documentos da base de conhecimento' });
  }
});

/**
 * Rota para remover documento da base de conhecimento
 */
aiRouter.delete('/knowledge-base/:id', (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    
    if (!documentId) {
      return res.status(400).json({ error: 'ID do documento é obrigatório' });
    }
    
    // Aqui implementaríamos a lógica para remover o documento do banco de dados
    // e excluir o arquivo físico
    
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