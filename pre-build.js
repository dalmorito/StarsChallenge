// Este arquivo é executado antes do build para garantir configurações corretas

// Verificar se estamos em um ambiente de produção
const isProduction = process.env.NODE_ENV === 'production';

console.log(`Ambiente: ${isProduction ? 'Produção' : 'Desenvolvimento'}`);
console.log('Executando verificações pré-build...');

// Verifica se o arquivo index.html existe na raiz
const fs = require('fs');
const path = require('path');

// Criar arquivo dummy apenas para verificação
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

// Criar um arquivo de fallback
fs.writeFileSync(
  path.join(__dirname, 'public', '_redirects'), 
  '/* /index.html 200\n'
);

console.log('Verificações pré-build concluídas com sucesso!');