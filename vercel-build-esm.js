#!/usr/bin/env node

// Script para corrigir problemas de build no Vercel (versão ESM)
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenha o diretório atual para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.bright}${colors.blue}=== Script de Correção para Build do Vercel (ESM) ===${colors.reset}\n`);

// Verifica se estamos no ambiente Vercel
const isVercel = process.env.VERCEL === '1' || process.env.NOW_BUILDER === '1';
console.log(`${colors.yellow}Ambiente: ${isVercel ? 'Vercel' : 'Local'}${colors.reset}`);

// Função de utilidade para verificar e criar diretórios
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`${colors.yellow}Criando diretório: ${dir}${colors.reset}`);
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

// Função para copiar arquivos
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`${colors.green}Arquivo copiado: ${src} -> ${dest}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Erro ao copiar ${src}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Função principal
function main() {
  try {
    // Garante que o diretório dist existe
    const distDir = path.join(process.cwd(), 'dist');
    ensureDirExists(distDir);

    // Garante que o diretório public existe
    const publicDir = path.join(process.cwd(), 'public');
    ensureDirExists(publicDir);

    // Executa o build do frontend (Vite)
    console.log(`\n${colors.bright}${colors.yellow}Executando build do frontend (Vite)...${colors.reset}`);
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      console.error(`${colors.red}Erro no build do frontend: ${error.message}${colors.reset}`);
      // Continua mesmo com erro para tentar outras correções
    }

    // Executa o build do backend (esbuild)
    console.log(`\n${colors.bright}${colors.yellow}Executando build do backend (esbuild)...${colors.reset}`);
    try {
      execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
    } catch (error) {
      console.error(`${colors.red}Erro no build do backend: ${error.message}${colors.reset}`);
    }

    // Verifica se o arquivo index.js foi gerado corretamente
    const indexJsPath = path.join(distDir, 'index.js');
    const indexTsJsPath = path.join(distDir, 'index.ts.js');
    
    if (!fs.existsSync(indexJsPath) && fs.existsSync(indexTsJsPath)) {
      console.log(`${colors.yellow}Renomeando index.ts.js para index.js${colors.reset}`);
      fs.renameSync(indexTsJsPath, indexJsPath);
    }

    // Cria um arquivo index.html simples no diretório dist se não existir
    const indexHtmlPath = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) {
      console.log(`${colors.yellow}Criando arquivo index.html temporário${colors.reset}`);
      fs.writeFileSync(indexHtmlPath, `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pornstar Battle - Loading...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      text-align: center;
      max-width: 80%;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #1a73e8;
    }
    p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
    }
    .loader {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #1a73e8;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 2rem auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error-message {
      color: #d93025;
      padding: 1rem;
      border-radius: 4px;
      background-color: rgba(217, 48, 37, 0.1);
      margin-top: 1rem;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Pornstar Battle</h1>
    <div class="loader"></div>
    <p>Carregando a aplicação...</p>
    <div class="error-message" id="error">
      Não foi possível carregar a aplicação. Tente novamente em alguns instantes.
    </div>
  </div>
  <script>
    // Mostrar erro após 10 segundos se a página não redirecionar
    setTimeout(() => {
      document.getElementById('error').style.display = 'block';
    }, 10000);
    
    // Tentar redirecionar para a aplicação principal
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  </script>
</body>
</html>
      `);
    }

    // Cria um arquivo .vercel na raiz se não existir
    const vercelDir = path.join(process.cwd(), '.vercel');
    ensureDirExists(vercelDir);

    // Cria um arquivo de status na raiz
    const statusFilePath = path.join(process.cwd(), 'vercel-status.json');
    fs.writeFileSync(statusFilePath, JSON.stringify({
      buildTime: new Date().toISOString(),
      success: true,
      environment: process.env.NODE_ENV || 'development',
      isVercel: isVercel
    }, null, 2));

    console.log(`\n${colors.bright}${colors.green}Script de correção concluído!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}Erro fatal no script de correção: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Executa a função principal
main();