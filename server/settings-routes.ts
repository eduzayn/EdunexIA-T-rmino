import { Router, Request, Response } from "express";
import { db } from "./db";
import { systemSettings, insertSystemSettingsSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

export const settingsRouter = Router();

/**
 * Middleware para verificar se o usuário está autenticado e é admin ou professor
 */
function isAuthenticatedAdminOrTeacher(req: Request, res: Response, next: Function) {
  const user = req.user as any;
  if (!user) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }
  
  if (user.role !== "admin" && user.role !== "teacher") {
    return res.status(403).json({ error: "Acesso não autorizado. Apenas administradores e professores podem acessar esta funcionalidade." });
  }
  
  next();
}

/**
 * Rota para obter as configurações do sistema
 */
settingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Buscar configurações existentes
    const existingSettings = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.tenantId, tenantId));
    
    // Se já existem configurações, retornar
    if (existingSettings.length > 0) {
      return res.json(existingSettings[0]);
    }
    
    // Se não existirem, criar configurações padrão
    const defaultSettings = {
      tenantId,
      maintenanceMode: false,
      maintenanceMessage: null,
      theme: 'light',
      defaultDateFormat: 'DD/MM/YYYY',
      defaultTimeFormat: 'HH:mm',
      timezone: 'America/Sao_Paulo',
      notificationsEnabled: true,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: true,
      customCss: null
    };
    
    const [newSettings] = await db.insert(systemSettings)
      .values(defaultSettings)
      .returning();
    
    return res.json(newSettings);
  } catch (error) {
    console.error("Erro ao obter configurações do sistema:", error);
    return res.status(500).json({ 
      error: "Erro ao obter configurações do sistema",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

/**
 * Rota para atualizar as configurações do sistema
 */
settingsRouter.put('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const tenantId = user.tenantId;
    
    // Validar dados de entrada
    const validatedData = insertSystemSettingsSchema.parse({
      ...req.body,
      tenantId
    });
    
    // Buscar configurações existentes
    const existingSettings = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.tenantId, tenantId));
    
    let updatedSettings;
    
    // Se já existem configurações, atualizar
    if (existingSettings.length > 0) {
      const [result] = await db.update(systemSettings)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(systemSettings.id, existingSettings[0].id))
        .returning();
      
      updatedSettings = result;
    } else {
      // Se não existirem, criar
      const [result] = await db.insert(systemSettings)
        .values(validatedData)
        .returning();
      
      updatedSettings = result;
    }
    
    return res.json(updatedSettings);
  } catch (error) {
    console.error("Erro ao atualizar configurações do sistema:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Dados de configuração inválidos",
        details: error.errors
      });
    }
    
    return res.status(500).json({
      error: "Erro ao atualizar configurações do sistema",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});