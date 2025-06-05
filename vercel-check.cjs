#!/usr/bin/env node
/**
 * Script para verificar se o build está correto para o deploy no Vercel
 * Executa um build de teste e verifica a integridade dos arquivos gerados
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para formatação do terminal
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";

console.log(`${BLUE}=== VERIFICAÇÃO PRÉ-DEPLOY DO VERCEL ===${RESET}`);
console.log(`Iniciando verificação de compatibilidade para deploy...`);

// Variáveis de configuração
const distDir = path.join(__dirname, 'dist');
const requiredFiles = ['index.html', 'assets'];
let errors = 0;
let warnings = 0;

// Função para executar um comando e capturar a saída
function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`${RED}Erro ao executar comando: ${command}${RESET}`);
    console.error(error.stderr || error.message);
    errors++;
    return '';
  }
}

// Função para verificar se um arquivo existe
function checkFileExists(filePath, isRequired = true) {
  const exists = fs.existsSync(filePath);
  if (!exists && isRequired) {
    console.error(`${RED}ERRO: Arquivo não encontrado: ${filePath}${RESET}`);
    errors++;
  } else if (!exists) {
    console.warn(`${YELLOW}AVISO: Arquivo não encontrado: ${filePath}${RESET}`);
    warnings++;
  }
  return exists;
}

// Verificar versão do Node
console.log(`\n${BLUE}Verificando versão do Node.js...${RESET}`);
const nodeVersion = exec('node --version');
console.log(`Versão do Node.js: ${nodeVersion.trim()}`);

if (!nodeVersion.includes('v18')) {
  console.warn(`${YELLOW}AVISO: O Vercel está configurado para Node.js 18.x, mas você está usando ${nodeVersion.trim()}${RESET}`);
  warnings++;
}

// Verificar a configuração do Vite para o Vercel
console.log(`\n${BLUE}Verificando configuração do Vite...${RESET}`);

if (checkFileExists('vite.vercel.config.ts')) {
  console.log(`${GREEN}✓ vite.vercel.config.ts encontrado${RESET}`);
} else {
  return;
}

// Verificar script de build do Vercel
console.log(`\n${BLUE}Verificando script de build...${RESET}`);
if (checkFileExists('vercel-build.cjs')) {
  console.log(`${GREEN}✓ vercel-build.cjs encontrado${RESET}`);
} else {
  return;
}

// Verificar se o distDir existe e limpar se necessário
if (fs.existsSync(distDir)) {
  console.log(`\nLimpando diretório de saída anterior: ${distDir}`);
  exec(`rm -rf ${distDir}`);
}

// Executar o build
console.log(`\n${BLUE}Executando build de teste...${RESET}`);
try {
  exec('node vercel-build.cjs');
  console.log(`${GREEN}✓ Build concluído com sucesso${RESET}`);
} catch (error) {
  console.error(`${RED}ERRO: Falha no build${RESET}`);
  errors++;
  process.exit(1);
}

// Verificar se todos os arquivos necessários foram gerados
console.log(`\n${BLUE}Verificando arquivos gerados...${RESET}`);
if (fs.existsSync(distDir)) {
  console.log(`${GREEN}✓ Diretório de saída criado: ${distDir}${RESET}`);
  
  const files = fs.readdirSync(distDir);
  console.log(`Arquivos encontrados: ${files.join(', ')}`);
  
  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    if (checkFileExists(filePath)) {
      console.log(`${GREEN}✓ Arquivo encontrado: ${file}${RESET}`);
    }
  }
  
  // Verificar a existência de index.html e seu conteúdo
  const indexPath = path.join(distDir, 'index.html');
  if (checkFileExists(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    
    if (!content.includes('<script') || !content.includes('<link')) {
      console.error(`${RED}ERRO: index.html não contém scripts ou links necessários${RESET}`);
      errors++;
    } else {
      console.log(`${GREEN}✓ index.html parece válido${RESET}`);
    }
  }
  
  // Verificar se a pasta assets contém JavaScript e CSS
  const assetsPath = path.join(distDir, 'assets');
  if (checkFileExists(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    const hasJS = assetFiles.some(file => file.endsWith('.js'));
    const hasCSS = assetFiles.some(file => file.endsWith('.css'));
    
    if (!hasJS) {
      console.error(`${RED}ERRO: Não foram encontrados arquivos JavaScript em /assets${RESET}`);
      errors++;
    }
    
    if (!hasCSS) {
      console.warn(`${YELLOW}AVISO: Não foram encontrados arquivos CSS em /assets${RESET}`);
      warnings++;
    }
  }
  
} else {
  console.error(`${RED}ERRO: Diretório de saída não foi criado: ${distDir}${RESET}`);
  errors++;
}

// Verificar arquivo vercel.json
console.log(`\n${BLUE}Verificando configuração do Vercel...${RESET}`);
if (checkFileExists('vercel.json')) {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.buildCommand && vercelConfig.buildCommand.includes('vercel-build.cjs')) {
    console.log(`${GREEN}✓ vercel.json contém buildCommand correto${RESET}`);
  } else {
    console.warn(`${YELLOW}AVISO: vercel.json não contém referência ao script vercel-build.cjs${RESET}`);
    warnings++;
  }
  
  if (vercelConfig.outputDirectory && vercelConfig.outputDirectory === 'dist') {
    console.log(`${GREEN}✓ vercel.json define o diretório de saída como "dist"${RESET}`);
  } else {
    console.warn(`${YELLOW}AVISO: vercel.json não define corretamente o diretório de saída${RESET}`);
    warnings++;
  }
} else {
  console.error(`${RED}ERRO: vercel.json não encontrado${RESET}`);
  errors++;
}

// Relatório final
console.log(`\n${BLUE}=== RELATÓRIO FINAL ===${RESET}`);
if (errors === 0 && warnings === 0) {
  console.log(`${GREEN}✓ Todas as verificações passaram! O projeto está pronto para deploy no Vercel.${RESET}`);
} else {
  if (errors > 0) {
    console.error(`${RED}✗ Foram encontrados ${errors} erro(s) que podem impedir o deploy correto.${RESET}`);
  }
  
  if (warnings > 0) {
    console.warn(`${YELLOW}⚠ Foram encontrados ${warnings} aviso(s) que podem causar problemas no deploy.${RESET}`);
  }
  
  console.log(`\nConsulte o arquivo VERCEL_DEPLOY_GUIDE.md para obter instruções sobre como resolver esses problemas.`);
}

// Limpar o diretório dist gerado pelo teste
if (fs.existsSync(distDir)) {
  console.log(`\nLimpando diretório de teste: ${distDir}`);
  exec(`rm -rf ${distDir}`);
}

process.exit(errors > 0 ? 1 : 0);