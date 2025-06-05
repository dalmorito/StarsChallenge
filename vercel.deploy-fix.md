# Guia de Deploy no Vercel (Solução de Problemas)

Este arquivo contém instruções para resolver os problemas de deploy no Vercel, onde ocorre um erro com o script de build devido à configuração de módulos no projeto.

## Problema

O erro ocorre porque o projeto está configurado para usar ES Modules (`"type": "module"` no package.json), mas o script de build está usando sintaxe CommonJS (`require`).

## Solução

### 1. Configuração Simplificada (Recomendada)

Estamos usando uma configuração simplificada no `vercel.json`:

```json
{
  "version": 2,
  "framework": "vite",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/api/.*", "status": 404 },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

Esta configuração:
- Usa o builder padrão do Vercel para projetos estáticos
- Configura corretamente o diretório de saída
- Direciona as requisições para o index.html (SPA)
- Retorna 404 para chamadas à API, já que este é apenas o frontend

### 2. Configurações no Dashboard do Vercel

Ao importar o projeto no Vercel, certifique-se de usar estas configurações:

- **Framework Preset**: Vite
- **Build Command**: npm run build
- **Output Directory**: dist
- **Root Directory**: . (diretório raiz)
- **Node.js Version**: 18.x (não use 22.x que é muito recente)

### 3. Remover Scripts Desnecessários

Se o deploy continuar falhando, você pode remover os scripts de build personalizados:

```bash
rm vercel-build-fix.js vercel-build-esm.js
```

### 4. Considerações Importantes

- Esta configuração é apenas para o **frontend** da aplicação
- O **backend** (Express) não funcionará no Vercel com esta configuração
- Para uma aplicação full-stack, considere usar o Render.com conforme configurado em DEPLOY_RENDER.md

## Alternativa para Aplicação Full-Stack

Se você precisa que tanto o frontend quanto o backend funcionem no mesmo deploy:

1. Use o Render.com seguindo as instruções em DEPLOY_RENDER.md
2. Configure um backend serverless no Vercel com funções API separadas