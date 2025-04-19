# Deploy no Render

## Instruções para deploy 

### 1. Configuração pelo Dashboard do Render

1. No dashboard do Render, clique em "New" e selecione "Web Service"
2. Conecte seu repositório GitHub
3. Configure os seguintes campos:
   - **Name**: movie-stars-battle (ou o nome que preferir)
   - **Environment**: Node
   - **Build Command**: `npm install && node build_script.js`
   - **Start Command**: `NODE_ENV=production node dist/index.js`
   - **Root Directory**: `.` (muito importante! sem isso o deploy falha)
   
### 2. Configuração de Variáveis de Ambiente

Para evitar o aviso de tamanho de chunk:

- **VITE_CHUNK_SIZE_WARNING_LIMIT**: `2000`

### 3. Configuração do Banco de Dados (IMPORTANTE para persistência)

Os serviços gratuitos do Render têm "spin down" após períodos de inatividade. Quando o serviço reinicia, todos os dados em memória são perdidos. Para manter seus dados persistentes, você **precisa** configurar um banco de dados PostgreSQL.

#### A. Configurar banco de dados Neon

1. Crie uma conta em [Neon Database](https://neon.tech/)
2. Crie um novo projeto
3. Na tela de conexão, copie a string de conexão `DATABASE_URL`
4. Certifique-se de substituir `[your-password]` pela senha real na string

#### B. Adicionar URL do banco de dados ao Render

1. No painel do seu serviço web no Render, vá para "Environment"
2. Adicione a variável de ambiente:
   - **DATABASE_URL**: Cole a string de conexão do Neon

#### C. Soluções alternativas para evitar perda de dados

Nos planos gratuitos, onde o "spin down" é inevitável, considere estas opções:

1. **Agende pings regulares:** Configure um serviço como UptimeRobot para fazer ping no seu site a cada 5 minutos, evitando a inatividade
2. **Upgrade para plano pago:** Os planos pagos do Render permitem configurar `minInstances: 1` para manter o serviço sempre ativo

### 3. Opção Alternativa: Deploy com render.yaml

A maneira mais simples é usar o arquivo `render.yaml` deste projeto para fazer um deploy usando o Blueprint do Render.

1. Vá para https://dashboard.render.com/select-repo
2. Escolha o repositório
3. O Render detectará o arquivo render.yaml e configurará tudo automaticamente

### Notas importantes:

1. O script `build_script.js` foi criado especialmente para o Render e inclui configurações para ignorar os avisos de tamanho de chunk. Ele executa o build do Vite com o parâmetro `--silent` e configura a variável de ambiente necessária.

2. É fundamental definir o `rootDir: .` no arquivo `render.yaml` para que o Render encontre corretamente o package.json. Sem essa configuração, o Render procura no diretório `/opt/render/project/src/` e falha com erro `ENOENT: no such file or directory, open '/opt/render/project/src/package.json'`.

3. O aplicativo funcionará mesmo sem a variável DATABASE_URL, pois implementa um fallback para armazenamento em memória, mas os dados serão perdidos sempre que o servidor reiniciar.

4. Recomendamos usar um banco de dados Neon PostgreSQL para persistência de dados. Quando configurado corretamente, o sistema manterá o histórico de todos os torneios e estatísticas dos competidores.

5. Mesmo se o banco de dados ficar temporariamente indisponível, o sistema continuará funcionando com armazenamento em memória e tentará reconectar periodicamente.

### Solução de problemas comuns:

1. **Erro ENOENT no package.json**: Se você vir um erro como `Error: ENOENT: no such file or directory, open '/opt/render/project/src/package.json'`, certifique-se de que `rootDir: .` esteja definido no seu `render.yaml`.

2. **Erro de conexão com banco de dados**: O sistema foi projetado para continuar funcionando mesmo sem banco de dados, usando armazenamento em memória como fallback. No entanto, os dados serão perdidos ao reiniciar o servidor.