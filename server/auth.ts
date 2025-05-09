import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./database-storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    // Verifica se temos uma senha armazenada válida com salt
    if (!stored || !stored.includes(".")) {
      console.log("Formato de senha inválido:", stored);
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    
    // Verifica se temos tanto o hash quanto o salt
    if (!hashed || !salt) {
      console.log("Hash ou salt ausente:", { hashed, salt });
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Erro ao comparar senhas:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "edunexia-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
    },
    // Usar o store configurado na classe DatabaseStorage
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Tentativa de login com:", { username });
        const user = await storage.getUserByUsername(username);
        console.log("Usuário encontrado:", user ? "Sim" : "Não");
        
        if (!user) {
          return done(null, false, { message: "Nome de usuário ou senha incorretos" });
        }
        
        console.log("Comparando senha com hash:", user.password);
        const passwordMatches = await comparePasswords(password, user.password);
        console.log("Senha corresponde:", passwordMatches ? "Sim" : "Não");
        
        if (!passwordMatches) {
          return done(null, false, { message: "Nome de usuário ou senha incorretos" });
        }
        
        return done(null, user);
      } catch (error) {
        console.error("Erro na autenticação:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Set default tenant ID to 1 for now (we would determine this based on domain in a real app)
      const tenantId = req.body.tenantId || 1;
      
      // Check if username already exists for this tenant
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      // Set default role to student if not specified
      const role = req.body.role || 'student';
      
      const user = await storage.createUser({
        ...req.body,
        tenantId,
        role,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Send user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: SelectUser, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Nome de usuário ou senha incorretos" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        // Send user without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Send user without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
  
  // Create initial tenant if it doesn't exist
  app.post("/api/setup-tenant", async (req, res, next) => {
    try {
      const existingTenant = await storage.getTenantById(1);
      if (existingTenant) {
        return res.status(400).json({ message: "Tenant already exists" });
      }
      
      const tenant = await storage.createTenant({
        name: "Edunéxia Demo",
        domain: "demo.edunexia.com",
        logoUrl: "/logo.svg",
        primaryColor: "#3B82F6",
        secondaryColor: "#10B981",
      });
      
      res.status(201).json(tenant);
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint para criar usuário administrativo (apenas para desenvolvimento)
  app.post("/api/setup-admin", async (req, res, next) => {
    try {
      // Verificar se já existe um usuário admin
      const existingAdmin = await storage.getUserByUsername("admintest");
      
      if (existingAdmin) {
        return res.status(200).json({
          message: "Usuário admin já existe",
          user: { 
            id: existingAdmin.id,
            username: existingAdmin.username,
            role: existingAdmin.role,
            tenantId: existingAdmin.tenantId
          }
        });
      }
      
      // Criar o usuário admin
      const adminUser = await storage.createUser({
        username: "admintest",
        password: await hashPassword("password123"),
        email: "admin@edunexia.com",
        fullName: "Administrador Teste",
        role: "admin",
        tenantId: 1,
        isActive: true,
        avatarUrl: null,
      });
      
      // Ocultar senha na resposta
      const { password, ...userWithoutPassword } = adminUser;
      
      res.status(201).json({
        message: "Usuário admin criado com sucesso",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Erro ao criar usuário admin:", error);
      next(error);
    }
  });
}
