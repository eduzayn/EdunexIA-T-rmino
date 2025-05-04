import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// Inicializa o cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Modelo da Anthropic (o mais recente no momento)
// Nota importante: o modelo mais recente da Anthropic é "claude-3-7-sonnet-20250219", lançado em 24 de fevereiro de 2025
const MODEL = 'claude-3-7-sonnet-20250219';

/**
 * Serviço de IA que gerencia interações com a API do Claude da Anthropic 
 */
export class AIService {
  
  /**
   * Envia uma mensagem para o modelo Claude e retorna a resposta
   * @param messages Array de mensagens no formato Claude (role e content)
   * @param systemPrompt Instruções do sistema para o modelo
   * @param maxTokens Número máximo de tokens na resposta
   * @returns A resposta do modelo
   */
  async sendMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string,
    maxTokens: number = 1024
  ) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages,
      });

      return {
        content: response.content[0].text,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: 
            (response.usage?.input_tokens || 0) + 
            (response.usage?.output_tokens || 0)
        }
      };
    } catch (error: any) {
      console.error('Erro ao chamar a API Anthropic:', error);
      throw new Error(`Erro na API do modelo de IA: ${error.message}`);
    }
  }

  /**
   * Analisa um texto com o modelo Claude
   * @param text Texto para análise
   * @param instruction Instruções específicas para a análise
   * @returns Resultado da análise
   */
  async analyzeText(text: string, instruction: string) {
    const systemPrompt = `Você é Prof. Ana, uma assistente educacional especializada. 
    Analise o texto fornecido de acordo com as instruções específicas. 
    Seja concisa, objetiva e didática em suas análises.`;

    const messages = [
      {
        role: 'user' as const,
        content: `Instrução: ${instruction}\n\nTexto para análise: ${text}`
      }
    ];

    return this.sendMessage(messages, systemPrompt);
  }

  /**
   * Responde a uma pergunta sobre um tópico educacional
   * @param question Pergunta do usuário
   * @param conversationHistory Histórico da conversa
   * @param contextData Dados de contexto sobre o curso/disciplina
   * @returns Resposta para a pergunta
   */
  async answerEducationalQuestion(
    question: string, 
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    contextData?: string
  ) {
    const systemPrompt = `Você é Prof. Ana, uma assistente educacional que ajuda alunos e professores.
    Seu objetivo é fornecer explicações claras, didáticas e academicamente precisas.
    Você deve ser útil, respeitosa e adaptativa ao nível de conhecimento do usuário.
    ${contextData ? `\nInformações de contexto sobre o curso/disciplina: ${contextData}` : ''}`;

    // Combina o histórico com a nova pergunta
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: question }
    ];

    return this.sendMessage(messages, systemPrompt);
  }

  /**
   * Gera material didático baseado nos parâmetros fornecidos
   * @param topic Tópico do material
   * @param type Tipo de material (resumo, exercício, avaliação, etc.)
   * @param parameters Parâmetros adicionais
   * @returns Material didático gerado
   */
  async generateEducationalContent(topic: string, type: string, parameters: Record<string, any> = {}) {
    const systemPrompt = `Você é Prof. Ana, especializada em criar conteúdo educacional de alta qualidade.
    Você deve gerar conteúdo didático, bem estruturado e academicamente preciso.
    O conteúdo deve ser adequado para o contexto educacional brasileiro e seguir as melhores práticas pedagógicas.`;

    const parametersText = Object.entries(parameters)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const message = {
      role: 'user' as const,
      content: `Gere ${type} sobre "${topic}".\n\nParâmetros:\n${parametersText}`
    };

    return this.sendMessage([message], systemPrompt, 2048);
  }

  /**
   * Analisa uma imagem (documentos, gráficos, etc.)
   * @param imageBase64 Imagem em formato base64
   * @param prompt Instruções para análise da imagem
   * @returns Análise da imagem
   */
  async analyzeImage(imageBase64: string, prompt: string) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: "Você é Prof. Ana, especialista em análise de conteúdo educacional visual. Analise a imagem fornecida e responda de forma útil e educacional.",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Analise esta imagem detalhadamente e descreva seu conteúdo pedagógico."
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }]
      });

      return {
        content: response.content[0].text,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: 
            (response.usage?.input_tokens || 0) + 
            (response.usage?.output_tokens || 0)
        }
      };
    } catch (error: any) {
      console.error('Erro ao analisar imagem:', error);
      throw new Error(`Erro ao analisar imagem: ${error.message}`);
    }
  }
}

// Exporta uma instância singleton do serviço
export const aiService = new AIService();