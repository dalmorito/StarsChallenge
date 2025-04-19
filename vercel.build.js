// Build script para Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Constrói o frontend usando Vite
  console.log('Construindo o frontend com Vite...');
  execSync('vite build', { stdio: 'inherit' });

  // Constrói o backend usando esbuild
  console.log('Construindo o backend com esbuild...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

  // Verifica se o arquivo de saída do backend foi renomeado corretamente
  const indexPath = path.join(process.cwd(), 'dist', 'index.js');
  if (!fs.existsSync(indexPath)) {
    console.log('Renomeando o arquivo de saída do backend...');
    fs.renameSync(
      path.join(process.cwd(), 'dist', 'index.ts.js'),
      indexPath
    );
  }

  // Cria um arquivo de verificação para confirmar que o build foi concluído
  fs.writeFileSync(
    path.join(process.cwd(), 'dist', 'build-info.json'),
    JSON.stringify({
      buildTime: new Date().toISOString(),
      success: true,
      vercel: true
    })
  );

  console.log('Build concluído com sucesso!');
} catch (error) {
  console.error('Erro durante o build:', error);
  process.exit(1);
}