import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from '../shared/schema';
import { CONTESTANTS_LIST } from '../shared/schema';

// Configuração para ambiente serverless
neonConfig.fetchConnectionCache = true;

// Função para criar as tabelas do banco de dados
async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida');
  }

  const client = neon(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  console.log('Iniciando migração do banco de dados...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migração concluída com sucesso!');
    
    // Verificar se já existem contestantes
    const existingContestants = await db.query.contestants.findMany();
    
    if (existingContestants.length === 0) {
      console.log('Inicializando banco de dados com contestantes padrão...');
      
      // Inserir todos os contestantes da lista
      for (const name of CONTESTANTS_LIST) {
        // Tenta encontrar nacionalidade com base no nome
        let nationality = '';
        
        // Lógica simplificada para atribuir nacionalidades, pode ser melhorada
        if (name.includes('Lee') || name.includes('Li') || name.includes('Lin') || name.includes('Ling')) {
          nationality = 'Chinese';
        } else if (name.includes('Akira') || name.includes('Ozawa') || name.includes('Marica') || name.includes('Mizukawa')) {
          nationality = 'Japanese';
        } else if (name.includes('Thai') || name.includes('Pons')) {
          nationality = 'Thai';
        } else if (name.includes('Rae') || name.includes('Lil Black')) {
          nationality = 'Japanese';
        } else if (name.includes('Singh') || name.includes('Priya')) {
          nationality = 'Indian';
        } else if (name.includes('Mia Khalifa')) {
          nationality = 'Lebanese';
        } else if (name.includes('Kira') || name.includes('Evelina') || name.includes('Lola Taylor')) {
          nationality = 'Russian';
        } else if (name.includes('Gina Gerson') || name.includes('Sabrisse')) {
          nationality = 'Czech';
        } else if (name.includes('Silvia Saint') || name.includes('Cindy Hope')) {
          nationality = 'Hungarian';
        } else if (name.includes('Venus Lux') || name.includes('Korra Del Rio')) {
          nationality = 'Transgender';
        } else if (name.includes('Luna Corazon') || name.includes('Jenny Pretinha')) {
          nationality = 'Brazilian';
        } else if (name.includes('Ana Foxxx') || name.includes('Misty Stone')) {
          nationality = 'African American';
        } else if (name.includes('Esperanza') || name.includes('Frida Sante')) {
          nationality = 'Latina';
        } else {
          nationality = 'USA';
        }
        
        // Criar contestante com valores padrão
        await db.insert(schema.contestants).values({
          name,
          nationality,
          points: 1000,
          tournamentPoints: 0,
          matches: 0,
          wins: 0,
          losses: 0,
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0,
          active: false
        });
      }
      
      console.log(`${CONTESTANTS_LIST.length} contestantes inseridos no banco de dados.`);
    } else {
      console.log(`Banco de dados já possui ${existingContestants.length} contestantes.`);
    }
    
    return true;
  } catch (error) {
    console.error('Erro durante a migração:', error);
    return false;
  }
}

// Executar as migrações se este arquivo for executado diretamente (compatível com ESM)
// Os módulos ES não possuem 'require.main === module', então removemos essa checagem
// e contamos com a importação explícita da função runMigrations

export { runMigrations };