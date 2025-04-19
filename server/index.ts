import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, setupImageProxy } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initDatabase } from "./db";
import { runMigrations } from "./migrate";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para logging de API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("Inicializando o sistema...");
  
  // Inicializa o banco de dados
  console.log("Inicializando banco de dados...");
  const dbInitialized = await initDatabase();
  
  if (!dbInitialized) {
    console.warn("AVISO: Banco de dados não inicializado. Usando armazenamento em memória.");
    // Continuamos a execução com armazenamento em memória
  }
  
  // Temporariamente pulamos as migrações automáticas devido a problemas técnicos
  console.log("Pulando migrações automáticas para focar na implementação...");
  
  // Vamos tentar executar as migrações 
  // Mas em caso de erro, continuamos usando o armazenamento em memória
  console.log("Tentando executar as migrações...");
  try {
    if (process.env.DATABASE_URL) {
      // Se temos DATABASE_URL, tentamos executar as migrações
      await runMigrations().catch(err => {
        console.warn("Aviso: Falha ao executar migrações:", err instanceof Error ? err.message : String(err));
      });
    } else {
      console.log("DATABASE_URL não definida, pulando migrações.");
    }
  } catch (err) {
    // Tratamos o erro de forma segura sem acessar propriedades
    console.warn("Aviso: Erro ao tentar migrações:", String(err));
    // Continuamos a execução mesmo com erro nas migrações
  }
  
  // Configura o proxy de imagens
  setupImageProxy(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
