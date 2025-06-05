// Este script modifica o build do Vite para funcionar melhor no Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para garantir que um diretório existe
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Função para copiar um arquivo
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`Arquivo copiado: ${src} -> ${dest}`);
}

// Limpa o diretório de saída se existir
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  console.log('Limpando diretório de saída...');
  execSync(`rm -rf ${distDir}`, { stdio: 'inherit' });
}

// Garante que o diretório dist existe
ensureDirExists(distDir);

// Executa apenas o build do cliente para o Vercel usando a configuração específica
console.log('Executando build apenas do cliente para o Vercel...');
try {
  execSync('npx vite build --config vite.vercel.config.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Erro ao construir o projeto:', error);
  process.exit(1);
}

// Cria um arquivo redirects no diretório de saída
const vercelConfigPath = path.join(distDir, '_vercel.json');

console.log('Criando arquivo de configuração específico para o Vercel...');
const vercelConfig = {
  "framework": "vite",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
};

// Verifica se o arquivo index.html foi gerado corretamente
const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('ERRO: index.html não foi gerado. Verifique a configuração do Vite.');
  process.exit(1);
}

// Escreve a configuração
fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));

// Verifica se todos os arquivos necessários estão presentes
console.log('Verificando arquivos gerados:');
const files = fs.readdirSync(distDir);
console.log('Arquivos em dist:', files.join(', '));

console.log('Build para o Vercel concluído com sucesso!');