# Guia de Implantação no Vercel

Este guia explica como implantar o projeto MovieStarBattle no Vercel.

## Pré-requisitos

1. Uma conta na [Vercel](https://vercel.com/)
2. Um banco de dados PostgreSQL (recomendamos o [NeonDB](https://neon.tech/) que é serverless)

## Arquivos de Configuração importantes

Este projeto contém arquivos específicos para deployment no Vercel:

- `vercel.json` - Define como o Vercel deve construir e servir a aplicação
- `vercel.build.js` - Script personalizado de build para garantir que o frontend e backend sejam construídos corretamente

## Configuração do Banco de Dados

1. Siga as instruções no arquivo `neon-setup.md` para configurar um banco de dados PostgreSQL no NeonDB
2. Anote a URL de conexão (DATABASE_URL)

## Implantação no Vercel

### Passo 1: Importar seu repositório Git

1. Faça login na sua conta Vercel
2. Clique em "Add New" → "Project"
3. Selecione o repositório que contém seu projeto e clique em "Import"

### Passo 2: Configurar variáveis de ambiente

Na tela de configuração, adicione as seguintes variáveis de ambiente:

- `DATABASE_URL`: A URL de conexão do seu banco de dados NeonDB
- `NODE_ENV`: Defina como `production`
- `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT`: Se estiver usando NeonDB, adicione esses valores também

### Passo 3: Configurar as opções de build

1. Na seção "Build and Output Settings", configure:
   - Framework Preset: `Other`
   - Build Command: `node vercel.build.js`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **IMPORTANTE**: Em configurações avançadas, defina:
   - Root Directory: `.` (certifique-se que está apontando para a raiz do projeto)
   - Node.js Version: `18.x` (ou a versão mais recente disponível)

3. Clique em "Deploy"

### Passo 4: Verificar o deployment

Após a implantação ser concluída, você verá uma URL gerada pelo Vercel onde seu aplicativo está rodando.

## Problemas comuns e soluções

### Código-fonte aparecendo em vez do site

Esse problema ocorre quando o Vercel não está configurado corretamente para construir sua aplicação. Verifique:

1. Se a configuração do Vercel está correta (`vercel.json` na raiz do projeto)
2. Se o script de build está funcionando corretamente
3. Se todas as variáveis de ambiente necessárias estão configuradas

Para resolver:

1. **Verifique se o Vercel está reconhecendo os arquivos de configuração**:
   - Certifique-se de que `vercel.json` está na raiz do projeto e não tem erros de sintaxe
   - Veja nos logs de build se o arquivo `vercel.build.js` está sendo executado

2. **Força uma reconstrução do projeto**:
   - No dashboard do Vercel, vá para seu projeto
   - Clique em "Deployments" → escolha o deployment mais recente
   - Clique em "..." → "Redeploy"

3. **Tente um deployment manual com CLI**:
   - Instale o Vercel CLI: `npm i -g vercel`
   - Execute `vercel` na raiz do projeto
   - Siga as instruções para configurar e fazer deploy

### Erros no Build

Se houver erros durante o build, verifique:

1. Os logs de build no dashboard do Vercel
2. Se todos os pacotes necessários estão instalados
3. Se as versões do Node.js e outras dependências são compatíveis

## Mantendo o aplicativo ativo

Para evitar que o banco de dados e a aplicação fiquem inativos por muito tempo, configure um serviço de monitoramento como o UptimeRobot conforme descrito no arquivo `uptime-monitor.md`.