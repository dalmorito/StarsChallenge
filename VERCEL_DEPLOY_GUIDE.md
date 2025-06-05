# Guia de Deploy no Vercel

Este documento contém instruções detalhadas para realizar o deploy deste projeto no Vercel, juntamente com estratégias para lidar com possíveis problemas.

## Configurações Disponíveis

Diversas configurações foram preparadas para garantir flexibilidade durante o deploy:

1. **Configuração Padrão (vercel.json)**
   - Usa o script `vercel-build.cjs` para construir apenas o cliente
   - Define Node.js 18.x como versão

2. **Configuração Mínima (vercel-minimal.json)**
   - Configuração simplificada com apenas o essencial
   - Útil quando há conflitos na configuração padrão

3. **Configuração Simples (vercel-simple.json)**
   - Incluí regras de rewrite específicas para APIs e estáticos
   - Usa o build script padrão do package.json

## Estratégia de Deploy

### 1. Deploy Padrão

O deploy padrão usa a configuração de `vercel.json` existente:

```bash
# No dashboard do Vercel:
# 1. Importe o repositório
# 2. Configure o diretório raiz como '.'
# 3. Defina o comando de build como 'node vercel-build.cjs'
# 4. Defina o diretório de saída como 'dist'
```

### 2. Alternativa com Arquivo de Build Personalizado

Se houver problemas com o deploy padrão:

1. Renomeie `vercel-minimal.json` para `vercel.json`
2. Faça o commit dessa mudança
3. Tente o deploy novamente

### 3. Diagnóstico de Problemas

Problemas comuns e soluções:

#### Conflito entre ESM e CommonJS

Este é um problema comum na integração com o Vercel. Para resolver:

```bash
# Adicione o seguinte ao package.json
"type": "module",
```

#### Falha ao Resolver Componentes UI

O Vercel pode ter problemas para resolver aliases de caminho como `@/components`:

1. Verifique se a configuração do Vite está correta no `vite.vercel.config.ts`
2. Certifique-se de que os `path.resolve` estão apontando para os diretórios corretos

#### Problemas com o Toaster

O componente Toast pode falhar no build. Uma solução implementada foi criar uma versão inline do componente Toaster diretamente no `App.tsx`.

## Variáveis de Ambiente

Após o deploy, configure as seguintes variáveis no dashboard do Vercel:

- `DATABASE_URL`: URL completa do banco PostgreSQL (Neon)
- Outras variáveis de ambiente necessárias para a aplicação

## Verificação Pós-Deploy

Depois que o deploy for concluído, verifique:

1. Se a página inicial carrega corretamente
2. Se as chamadas de API estão funcionando (inspecione o console)
3. Se as imagens estão sendo carregadas corretamente

## Resolução de Problemas

Se encontrar problemas após o deploy:

1. Verifique os logs de build no dashboard do Vercel
2. Teste localmente com:
   ```bash
   node vercel-build.cjs
   ```
3. Verifique se os arquivos estáticos foram gerados corretamente na pasta `dist`

## Referências

- [Documentação do Vercel para Node.js](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Configuração do Vite com Vercel](https://vitejs.dev/guide/static-deploy.html#vercel)