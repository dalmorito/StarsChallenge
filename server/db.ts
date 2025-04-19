import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Configuração para ambiente serverless
neonConfig.fetchConnectionCache = true;

// Variáveis para controlar o estado da conexão com o banco de dados
let useMemoryStorage = false;

// Inicializar SQL client e DB connection de forma segura
let dbClient: any = null;
let dbConnection: any = null;

// Verificar se a variável de ambiente está definida
if (!process.env.DATABASE_URL) {
  console.warn('ATENÇÃO: Nenhuma string de conexão de banco de dados (DATABASE_URL) foi fornecida.');
  console.warn('Usando armazenamento em memória como fallback. Os dados serão perdidos ao reiniciar o servidor.');
  useMemoryStorage = true;
} else {
  try {
    // Tentar estabelecer conexão com o banco de dados
    dbClient = neon(process.env.DATABASE_URL);
    dbConnection = drizzle(dbClient, { schema });
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    console.warn('Usando armazenamento em memória como fallback. Os dados serão perdidos ao reiniciar o servidor.');
    useMemoryStorage = true;
  }
}

// Exportar variáveis para uso no resto da aplicação
export const db = dbConnection;
export const sql = dbClient;
export const shouldUseMemoryStorage = useMemoryStorage;

// Variável para rastrear o status da conexão
let lastConnectionCheck = Date.now();
const CONNECTION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

/**
 * Verifica e garante que a conexão com o banco de dados está ativa
 * @returns true se a conexão está ativa, false caso contrário
 */
export async function ensureConnection() {
  // Se estamos usando armazenamento em memória ou não temos conexão, não há o que verificar
  if (useMemoryStorage || !dbClient) {
    return false;
  }
  
  const now = Date.now();
  
  // Se já testamos a conexão recentemente, não precisamos testar novamente
  if (now - lastConnectionCheck < CONNECTION_TIMEOUT) {
    return true;
  }
  
  try {
    // Testar a conexão com o banco de dados
    const result = await dbClient`SELECT NOW()`;
    if (result && result.length > 0) {
      console.log('Conexão com banco de dados verificada e ativa:', result[0]);
    } else {
      console.log('Conexão com banco de dados verificada, mas sem resultado');
    }
    lastConnectionCheck = now;
    return true;
  } catch (error) {
    console.error('Erro ao verificar conexão com o banco de dados:', error);
    
    // Tentar reconectar
    console.log('Tentando reconectar ao banco de dados...');
    try {
      const result = await dbClient`SELECT NOW()`;
      if (result && result.length > 0) {
        console.log('Reconexão bem-sucedida:', result[0]);
      } else {
        console.log('Reconexão bem-sucedida, mas sem resultado');
      }
      lastConnectionCheck = now;
      return true;
    } catch (reconnectError) {
      console.error('Falha na reconexão:', reconnectError);
      useMemoryStorage = true;
      return false;
    }
  }
}

/**
 * Inicializa o banco de dados e configura verificações periódicas
 * @returns true se a inicialização for bem-sucedida, false caso contrário
 */
export async function initDatabase() {
  console.log('Inicializando conexão com o banco de dados...');
  
  // Se estamos usando armazenamento em memória ou não temos conexão, não há o que inicializar
  if (useMemoryStorage || !dbClient) {
    console.log('Usando armazenamento em memória, ignorando inicialização do banco de dados.');
    return false;
  }
  
  try {
    // Testar a conexão com o banco de dados
    const result = await dbClient`SELECT NOW()`;
    if (result && result.length > 0) {
      console.log('Conexão com banco de dados bem sucedida!', result[0]);
    } else {
      console.log('Conexão com banco de dados bem sucedida, mas sem resultado!');
    }
    lastConnectionCheck = Date.now();
    
    // Configurar verificação periódica da conexão
    setInterval(async () => {
      await ensureConnection();
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos
    
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    console.warn('O sistema funcionará com armazenamento em memória. Os dados serão perdidos ao reiniciar o servidor.');
    useMemoryStorage = true;
    return false;
  }
}