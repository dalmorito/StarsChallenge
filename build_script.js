// Script customizado para o build no Render
// O objetivo é ignorar avisos de tamanho de chunk

// Definir a variável de ambiente NODE_ENV para produção
process.env.NODE_ENV = 'production';

// Aumentar o limite de tamanho de chunk para evitar avisos
process.env.VITE_CHUNK_SIZE_WARNING_LIMIT = '2000'; 

// Executar o build com o limite aumentado
const { execSync } = require('child_process');

console.log('🚀 Iniciando build com limite de chunk aumentado...');

try {
  // Executar o build ignorando avisos
  execSync('vite build --silent && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_CHUNK_SIZE_WARNING_LIMIT: '2000'
    }
  });
  
  console.log('✅ Build concluído com sucesso!');
} catch (error) {
  console.error('❌ Erro no build:', error);
  process.exit(1);
}