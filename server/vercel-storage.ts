import { VercelDbStorage } from "./vercel-db-storage";
import { MemStorage, IStorage } from "./storage";

/**
 * Configuração específica para Vercel que garante o uso do banco de dados
 * Este arquivo força o uso do PostgreSQL em produção, mesmo em ambiente serverless
 */

let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!storageInstance) {
    // Verificar se estamos no Vercel (ambiente de produção)
    const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    
    if (process.env.DATABASE_URL) {
      console.log(`[${isVercel ? 'VERCEL' : 'LOCAL'}] Inicializando VercelDbStorage com DATABASE_URL`);
      try {
        storageInstance = new VercelDbStorage();
        console.log(`[${isVercel ? 'VERCEL' : 'LOCAL'}] VercelDbStorage inicializado com sucesso`);
      } catch (error) {
        console.error(`[${isVercel ? 'VERCEL' : 'LOCAL'}] Erro ao inicializar VercelDbStorage:`, error);
        console.log(`[${isVercel ? 'VERCEL' : 'LOCAL'}] Usando MemStorage como fallback`);
        storageInstance = new MemStorage();
      }
    } else {
      console.error(`[${isVercel ? 'VERCEL' : 'LOCAL'}] DATABASE_URL não encontrada, usando MemStorage como fallback`);
      storageInstance = new MemStorage();
    }
  }
  
  return storageInstance;
}

// Garantir que a instância é criada apenas uma vez
const storage = getStorage();

// Exportar como default para uso direto
export default storage;