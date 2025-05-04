import { 
  AiKnowledgeBase, InsertAiKnowledgeBase,
  AiSettings, InsertAiSettings,
  AiConversation, InsertAiConversation,
  AiMessage, InsertAiMessage,
  AiGeneratedContent, InsertAiGeneratedContent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { 
  aiKnowledgeBase, aiSettings, aiConversations, aiMessages, aiGeneratedContent
} from "@shared/schema";

// AI Knowledge Base operations
export const aiKnowledgeBaseMethods = {
  async createAiKnowledgeBase(data: InsertAiKnowledgeBase): Promise<AiKnowledgeBase> {
    try {
      const [knowledgeEntry] = await db.insert(aiKnowledgeBase).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return knowledgeEntry;
    } catch (error) {
      console.error('Erro ao criar entrada na base de conhecimento da IA:', error);
      throw error;
    }
  },

  async getAiKnowledgeBaseById(id: number): Promise<AiKnowledgeBase | undefined> {
    try {
      const [knowledgeEntry] = await db.select().from(aiKnowledgeBase).where(eq(aiKnowledgeBase.id, id));
      return knowledgeEntry;
    } catch (error) {
      console.error('Erro ao buscar entrada da base de conhecimento da IA por ID:', error);
      return undefined;
    }
  },

  async getAiKnowledgeBaseByTenant(tenantId: number): Promise<AiKnowledgeBase[]> {
    try {
      return await db.select()
        .from(aiKnowledgeBase)
        .where(eq(aiKnowledgeBase.tenantId, tenantId))
        .orderBy(desc(aiKnowledgeBase.createdAt));
    } catch (error) {
      console.error('Erro ao buscar base de conhecimento da IA por tenant:', error);
      return [];
    }
  },

  async getAiKnowledgeBaseByCategory(tenantId: number, category: string): Promise<AiKnowledgeBase[]> {
    try {
      return await db.select()
        .from(aiKnowledgeBase)
        .where(
          and(
            eq(aiKnowledgeBase.tenantId, tenantId),
            eq(aiKnowledgeBase.category, category)
          )
        )
        .orderBy(desc(aiKnowledgeBase.createdAt));
    } catch (error) {
      console.error('Erro ao buscar base de conhecimento da IA por categoria:', error);
      return [];
    }
  },

  async updateAiKnowledgeBase(id: number, data: Partial<InsertAiKnowledgeBase>): Promise<AiKnowledgeBase> {
    try {
      const [updatedEntry] = await db.update(aiKnowledgeBase)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(aiKnowledgeBase.id, id))
        .returning();
      
      if (!updatedEntry) {
        throw new Error('Entrada da base de conhecimento da IA não encontrada');
      }
      
      return updatedEntry;
    } catch (error) {
      console.error('Erro ao atualizar entrada da base de conhecimento da IA:', error);
      throw error;
    }
  },

  async deleteAiKnowledgeBase(id: number): Promise<boolean> {
    try {
      const result = await db.delete(aiKnowledgeBase).where(eq(aiKnowledgeBase.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao excluir entrada da base de conhecimento da IA:', error);
      return false;
    }
  }
};

// AI Settings operations
export const aiSettingsMethods = {
  async getAiSettingsByTenant(tenantId: number): Promise<AiSettings | undefined> {
    try {
      const [settings] = await db.select().from(aiSettings).where(eq(aiSettings.tenantId, tenantId));
      return settings;
    } catch (error) {
      console.error('Erro ao buscar configurações da IA por tenant:', error);
      return undefined;
    }
  },

  async createOrUpdateAiSettings(tenantId: number, data: Partial<InsertAiSettings>): Promise<AiSettings> {
    try {
      // Verificar se já existem configurações para este tenant
      const [existingSettings] = await db.select().from(aiSettings).where(eq(aiSettings.tenantId, tenantId));
      
      if (existingSettings) {
        // Atualizar configurações existentes
        const [updatedSettings] = await db.update(aiSettings)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(aiSettings.tenantId, tenantId))
          .returning();
        
        return updatedSettings;
      } else {
        // Criar novas configurações
        const [newSettings] = await db.insert(aiSettings).values({
          tenantId,
          assistantName: data.assistantName || 'Prof. Ana',
          defaultModel: data.defaultModel || 'claude-3-7-sonnet-20250219',
          maxTokensPerRequest: data.maxTokensPerRequest || 2048,
          enabledFeatures: data.enabledFeatures || ['chat', 'contentGeneration', 'textAnalysis', 'imageAnalysis'],
          customInstructions: data.customInstructions || 'Atue como uma assistente educacional focada no contexto brasileiro.',
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        
        return newSettings;
      }
    } catch (error) {
      console.error('Erro ao criar/atualizar configurações da IA:', error);
      throw error;
    }
  }
};

// AI Conversation operations
export const aiConversationMethods = {
  async createAiConversation(data: InsertAiConversation): Promise<AiConversation> {
    try {
      const [conversation] = await db.insert(aiConversations).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return conversation;
    } catch (error) {
      console.error('Erro ao criar conversa com IA:', error);
      throw error;
    }
  },

  async getAiConversationById(id: number): Promise<AiConversation | undefined> {
    try {
      const [conversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, id));
      return conversation;
    } catch (error) {
      console.error('Erro ao buscar conversa com IA por ID:', error);
      return undefined;
    }
  },

  async getAiConversationsByUser(userId: number): Promise<AiConversation[]> {
    try {
      return await db.select()
        .from(aiConversations)
        .where(eq(aiConversations.userId, userId))
        .orderBy(desc(aiConversations.updatedAt));
    } catch (error) {
      console.error('Erro ao buscar conversas com IA por usuário:', error);
      return [];
    }
  },

  async getAiConversationsByTenant(tenantId: number): Promise<AiConversation[]> {
    try {
      return await db.select()
        .from(aiConversations)
        .where(eq(aiConversations.tenantId, tenantId))
        .orderBy(desc(aiConversations.updatedAt));
    } catch (error) {
      console.error('Erro ao buscar conversas com IA por tenant:', error);
      return [];
    }
  },

  async updateAiConversationTitle(id: number, title: string): Promise<AiConversation> {
    try {
      const [updatedConversation] = await db.update(aiConversations)
        .set({
          title,
          updatedAt: new Date()
        })
        .where(eq(aiConversations.id, id))
        .returning();
      
      if (!updatedConversation) {
        throw new Error('Conversa com IA não encontrada');
      }
      
      return updatedConversation;
    } catch (error) {
      console.error('Erro ao atualizar título de conversa com IA:', error);
      throw error;
    }
  },

  async deleteAiConversation(id: number): Promise<boolean> {
    try {
      // Primeiro, excluir todas as mensagens associadas a esta conversa
      await db.delete(aiMessages).where(eq(aiMessages.conversationId, id));
      
      // Em seguida, excluir a conversa
      const result = await db.delete(aiConversations).where(eq(aiConversations.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao excluir conversa com IA:', error);
      return false;
    }
  }
};

// AI Message operations
export const aiMessageMethods = {
  async createAiMessage(data: InsertAiMessage): Promise<AiMessage> {
    try {
      const [message] = await db.insert(aiMessages).values({
        ...data,
        timestamp: new Date(),
      }).returning();
      
      // Atualizar a data de atualização da conversa correspondente
      await db.update(aiConversations)
        .set({ updatedAt: new Date() })
        .where(eq(aiConversations.id, data.conversationId));
      
      return message;
    } catch (error) {
      console.error('Erro ao criar mensagem de IA:', error);
      throw error;
    }
  },

  async getAiMessagesByConversation(conversationId: number): Promise<AiMessage[]> {
    try {
      return await db.select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conversationId))
        .orderBy(asc(aiMessages.timestamp));
    } catch (error) {
      console.error('Erro ao buscar mensagens de conversa com IA:', error);
      return [];
    }
  }
};

// AI Generated Content operations
export const aiGeneratedContentMethods = {
  async createAiGeneratedContent(data: InsertAiGeneratedContent): Promise<AiGeneratedContent> {
    try {
      const [content] = await db.insert(aiGeneratedContent).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return content;
    } catch (error) {
      console.error('Erro ao criar conteúdo gerado pela IA:', error);
      throw error;
    }
  },

  async getAiGeneratedContentById(id: number): Promise<AiGeneratedContent | undefined> {
    try {
      const [content] = await db.select().from(aiGeneratedContent).where(eq(aiGeneratedContent.id, id));
      return content;
    } catch (error) {
      console.error('Erro ao buscar conteúdo gerado pela IA por ID:', error);
      return undefined;
    }
  },

  async getAiGeneratedContentByUser(userId: number): Promise<AiGeneratedContent[]> {
    try {
      return await db.select()
        .from(aiGeneratedContent)
        .where(eq(aiGeneratedContent.userId, userId))
        .orderBy(desc(aiGeneratedContent.createdAt));
    } catch (error) {
      console.error('Erro ao buscar conteúdo gerado pela IA por usuário:', error);
      return [];
    }
  },

  async getAiGeneratedContentByTenant(tenantId: number): Promise<AiGeneratedContent[]> {
    try {
      return await db.select()
        .from(aiGeneratedContent)
        .where(eq(aiGeneratedContent.tenantId, tenantId))
        .orderBy(desc(aiGeneratedContent.createdAt));
    } catch (error) {
      console.error('Erro ao buscar conteúdo gerado pela IA por tenant:', error);
      return [];
    }
  },

  async getAiGeneratedContentByType(tenantId: number, contentType: string): Promise<AiGeneratedContent[]> {
    try {
      return await db.select()
        .from(aiGeneratedContent)
        .where(
          and(
            eq(aiGeneratedContent.tenantId, tenantId),
            eq(aiGeneratedContent.contentType, contentType)
          )
        )
        .orderBy(desc(aiGeneratedContent.createdAt));
    } catch (error) {
      console.error('Erro ao buscar conteúdo gerado pela IA por tipo:', error);
      return [];
    }
  },

  async deleteAiGeneratedContent(id: number): Promise<boolean> {
    try {
      const result = await db.delete(aiGeneratedContent).where(eq(aiGeneratedContent.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao excluir conteúdo gerado pela IA:', error);
      return false;
    }
  }
};

// Export all methods together
export const aiStorageMethods = {
  ...aiKnowledgeBaseMethods,
  ...aiSettingsMethods,
  ...aiConversationMethods,
  ...aiMessageMethods,
  ...aiGeneratedContentMethods
};