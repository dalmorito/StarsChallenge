# Configuração do Banco de Dados Neon

Se você está usando o Neon Database para persistência, siga estas instruções para configurar corretamente seu banco de dados.

## 1. Criação do Banco no Neon

1. Cadastre-se em [Neon](https://neon.tech/) e crie um novo projeto
2. Ao criar o projeto, ele automaticamente criará um banco de dados chamado `neondb`
3. Obtenha a string de conexão na página de visão geral do projeto
4. Configure a string no Render como variável de ambiente `DATABASE_URL`

## 2. Inicializando o Banco de Dados

Quando o aplicativo iniciar pela primeira vez com a variável `DATABASE_URL` configurada, ele tentará criar as tabelas automaticamente. Em alguns casos, pode ser necessário forçar a migração inicial.

Para isso, você pode executar o seguinte SQL diretamente no console SQL do Neon:

```sql
-- Tabelas principais
CREATE TABLE IF NOT EXISTS contestants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  nationality TEXT DEFAULT '',
  points INTEGER NOT NULL DEFAULT 1000,
  tournament_points INTEGER NOT NULL DEFAULT 0,
  matches INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  gold_medals INTEGER NOT NULL DEFAULT 0,
  silver_medals INTEGER NOT NULL DEFAULT 0,
  bronze_medals INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  completed BOOLEAN NOT NULL DEFAULT false,
  current_round INTEGER NOT NULL DEFAULT 1,
  current_match INTEGER NOT NULL DEFAULT 1,
  matches INTEGER NOT NULL DEFAULT 0,
  champion INTEGER,
  runner_up INTEGER,
  third_place INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constraints de foreign key
ALTER TABLE tournaments ADD CONSTRAINT IF NOT EXISTS fk_champion 
  FOREIGN KEY (champion) REFERENCES contestants(id);

ALTER TABLE tournaments ADD CONSTRAINT IF NOT EXISTS fk_runner_up 
  FOREIGN KEY (runner_up) REFERENCES contestants(id);

ALTER TABLE tournaments ADD CONSTRAINT IF NOT EXISTS fk_third_place 
  FOREIGN KEY (third_place) REFERENCES contestants(id);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  contestant1_id INTEGER NOT NULL,
  contestant2_id INTEGER NOT NULL,
  winner_id INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Foreign keys para matches
ALTER TABLE matches ADD CONSTRAINT IF NOT EXISTS fk_tournament_id 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id);

ALTER TABLE matches ADD CONSTRAINT IF NOT EXISTS fk_contestant1_id 
  FOREIGN KEY (contestant1_id) REFERENCES contestants(id);

ALTER TABLE matches ADD CONSTRAINT IF NOT EXISTS fk_contestant2_id 
  FOREIGN KEY (contestant2_id) REFERENCES contestants(id);

ALTER TABLE matches ADD CONSTRAINT IF NOT EXISTS fk_winner_id 
  FOREIGN KEY (winner_id) REFERENCES contestants(id);

CREATE TABLE IF NOT EXISTS point_history (
  id SERIAL PRIMARY KEY,
  contestant_id INTEGER NOT NULL,
  tournament_id INTEGER NOT NULL,
  match_id INTEGER NOT NULL,
  points_before INTEGER NOT NULL,
  points_change INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign keys para point_history
ALTER TABLE point_history ADD CONSTRAINT IF NOT EXISTS fk_ph_contestant_id 
  FOREIGN KEY (contestant_id) REFERENCES contestants(id);

ALTER TABLE point_history ADD CONSTRAINT IF NOT EXISTS fk_ph_tournament_id 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id);

ALTER TABLE point_history ADD CONSTRAINT IF NOT EXISTS fk_ph_match_id 
  FOREIGN KEY (match_id) REFERENCES matches(id);

CREATE TABLE IF NOT EXISTS image_cache (
  id SERIAL PRIMARY KEY,
  contestant_id INTEGER NOT NULL,
  image_urls TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign keys para image_cache
ALTER TABLE image_cache ADD CONSTRAINT IF NOT EXISTS fk_ic_contestant_id 
  FOREIGN KEY (contestant_id) REFERENCES contestants(id);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Verificando a Conexão

Para verificar se o banco de dados está funcionando corretamente, observe os logs do aplicativo no Render após o deploy. Você deve ver mensagens como:

```
USANDO ARMAZENAMENTO PERSISTENTE (banco de dados PostgreSQL)
Inicializando o sistema...
Inicializando banco de dados...
Inicializando conexão com o banco de dados...
Conexão com banco de dados bem sucedida! { now: '2025-04-14 23:17:16.93765+00' }
```

Em caso de problemas de conexão, verifique se a string de conexão está correta e se as configurações de rede do Neon permitem conexões do Render.