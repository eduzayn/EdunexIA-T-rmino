import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Inicializa o cliente Anthropic com a chave API
// A chave API é obtida do ambiente (definida em .env ou nas variáveis de ambiente)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = 'claude-3-7-sonnet-20250219';
const MAX_TOKENS = 2048;

/**
 * Extrai o texto da resposta com tratamento seguro para diferentes tipos de conteúdo
 * @param content Array de blocos de conteúdo da resposta do Anthropic
 * @returns Texto extraído ou string vazia se não encontrado
 */
function extractResponseText(content: any[]): string {
  if (!content || content.length === 0) return '';
  
  const contentBlock = content[0];
  
  // Se for um objeto com propriedade 'text'
  if (typeof contentBlock === 'object' && 'text' in contentBlock) {
    return contentBlock.text;
  }
  
  // Se for um objeto com propriedade 'type' e 'text'
  if (typeof contentBlock === 'object' && contentBlock.type === 'text' && 'text' in contentBlock) {
    return contentBlock.text;
  }
  
  // Se for um objeto com valor como string
  if (typeof contentBlock === 'object' && contentBlock.value && typeof contentBlock.value === 'string') {
    return contentBlock.value;
  }
  
  // Se for uma string diretamente
  if (typeof contentBlock === 'string') {
    return contentBlock;
  }
  
  // Fallback para casos não tratados - converte para string
  if (contentBlock) {
    return String(contentBlock);
  }
  
  return '';
}

/**
 * Serviço de IA para o módulo educacional
 */
export const aiService = {
  /**
   * Responde a uma pergunta educacional com contexto
   * @param question Pergunta do usuário
   * @param conversationHistory Histórico de conversação para contexto
   * @param contextData Dados adicionais de contexto (opcional)
   * @returns Resposta da IA
   */
  async answerEducationalQuestion(
    question: string,
    conversationHistory: Array<{ role: string, content: string }> = [],
    contextData?: string
  ): Promise<{ content: string }> {
    try {
      // Formata o histórico de conversação no formato esperado pela API
      const messages = conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // Adiciona a pergunta atual
      messages.push({
        role: 'user',
        content: question
      });

      // Instruções para a IA atuar como assistente educacional
      const systemPrompt = `Você é Prof. Ana, uma assistente educacional especializada para o sistema Edunéxia. 
      Seu papel é fornecer informações precisas e úteis sobre tópicos educacionais, 
      ajudar com dúvidas pedagógicas e auxiliar na criação de conteúdo didático.
      
      Responda usando linguagem clara e acessível, adequada para educadores brasileiros.
      Quando relevante, mencione práticas pedagógicas baseadas em evidências.
      ${contextData ? `\n\nContexto adicional sobre o usuário ou a situação:\n${contextData}` : ''}`;

      // Faz a chamada para a API
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
      });

      return { content: extractResponseText(response.content) };
    } catch (error) {
      console.error('Erro ao responder pergunta:', error);
      throw new Error('Erro ao processar sua pergunta com a IA');
    }
  },

  /**
   * Analisa um texto educacional
   * @param text Texto para análise
   * @param instruction Instruções específicas para a análise
   * @returns Análise do texto
   */
  async analyzeText(
    text: string,
    instruction: string = 'Analise este texto e forneça insights pedagógicos.'
  ): Promise<{ content: string }> {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: `Você é Prof. Ana, uma assistente educacional especializada em análise de textos.
        Analise o texto fornecido seguindo as instruções específicas.
        Forneça uma análise detalhada e estruturada.`,
        messages: [
          {
            role: 'user',
            content: `Analise o seguinte texto educacional:\n\n---\n${text}\n---\n\nInstruções: ${instruction}`
          }
        ],
      });

      return { content: extractResponseText(response.content) };
    } catch (error) {
      console.error('Erro ao analisar texto:', error);
      throw new Error('Erro ao processar análise do texto com a IA');
    }
  },

  /**
   * Gera conteúdo educacional personalizado
   * @param topic Tópico ou assunto para o conteúdo
   * @param type Tipo de conteúdo (plano de aula, exercício, etc.)
   * @param parameters Parâmetros adicionais para personalização
   * @returns Conteúdo gerado
   */
  async generateEducationalContent(
    topic: string,
    type: string,
    parameters: Record<string, any> = {}
  ): Promise<{ content: string }> {
    try {
      // Formata os parâmetros em texto
      let parametersText = '';
      for (const [key, value] of Object.entries(parameters)) {
        if (value !== undefined && value !== null) {
          parametersText += `- ${key}: ${value}\n`;
        }
      }

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS * 2, // Aumenta o limite de tokens para conteúdos mais longos
        system: `Você é Prof. Ana, uma assistente educacional especializada em criar conteúdo didático de alta qualidade.
        Gere conteúdo educacional em português brasileiro, com linguagem adequada ao nível educacional especificado.
        Sempre inclua elementos práticos e exemplos concretos, além de orientações para aplicação em sala de aula.`,
        messages: [
          {
            role: 'user',
            content: `Crie um ${type} sobre o tema: "${topic}".
            
            Parâmetros:
            ${parametersText}
            
            Forneça o conteúdo completo, bem estruturado e pronto para uso.`
          }
        ],
      });

      return { content: response.content[0].text };
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      throw new Error('Erro ao gerar conteúdo educacional com a IA');
    }
  },

  /**
   * Analisa uma imagem
   * @param base64Image Imagem em formato base64
   * @param prompt Instruções específicas para a análise (opcional)
   * @returns Análise da imagem
   */
  async analyzeImage(
    base64Image: string,
    prompt: string = 'Analise esta imagem e descreva seu conteúdo educacional.'
  ): Promise<{ content: string }> {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: `Você é Prof. Ana, uma assistente educacional especializada em análise de imagens para fins pedagógicos.
        Analise detalhadamente a imagem fornecida, descrevendo seu conteúdo e relevância educacional.
        Considere possíveis aplicações pedagógicas da imagem.`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
      });

      return { content: response.content[0].text };
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      throw new Error('Erro ao analisar imagem com a IA');
    }
  }
};