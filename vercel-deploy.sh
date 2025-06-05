#!/bin/bash

# Este script é usado para preparar o projeto para deploy no Vercel
# Execute este script antes de fazer push para o GitHub

# Remover vercel.json atual (se existir)
if [ -f "vercel.json" ]; then
  echo "Removendo vercel.json atual..."
  rm vercel.json
fi

# Copiar vercel-minimal.json para vercel.json
echo "Copiando configuração minimal para vercel.json..."
cp vercel-minimal.json vercel.json

# Tornar o script executável
chmod +x vercel-deploy.sh

echo "Pronto! Seu projeto está configurado para deploy no Vercel."
echo "Faça commit e push dessas mudanças para o GitHub."
echo "Em seguida, importe o repositório no Vercel com as seguintes configurações:"
echo "  - Framework Preset: Vite"
echo "  - Build Command: npm run build"
echo "  - Output Directory: dist"
echo "  - Root Directory: ."
echo "  - Node.js Version: 18.x"