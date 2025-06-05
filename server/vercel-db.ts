import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

/**
 * Configuração específica para Vercel/produção
 * Força o uso do banco PostgreSQL no ambiente serverless
 */

let db: any = null;
let isInitialized = false;

export function initVercelDb() {
  if (!isInitialized) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não encontrada no ambiente Vercel');
    }
    
    console.log('[VERCEL-DB] Inicializando conexão com PostgreSQL');
    
    try {
      const sql = neon(databaseUrl);
      db = drizzle(sql, { schema });
      isInitialized = true;
      console.log('[VERCEL-DB] Conexão estabelecida com sucesso');
    } catch (error) {
      console.error('[VERCEL-DB] Erro ao conectar:', error);
      throw error;
    }
  }
  
  return db;
}

// Função para obter a instância do banco
export function getVercelDb() {
  if (!db) {
    return initVercelDb();
  }
  return db;
}

// Exportar como default
export default getVercelDb();