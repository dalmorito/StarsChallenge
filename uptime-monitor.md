# Configurando UptimeRobot para Evitar Spin Down no Render

O Render desliga (spin down) serviços gratuitos após períodos de inatividade, resultando em perda de dados quando você está usando armazenamento em memória. 

Uma solução é usar um serviço de monitoramento como o UptimeRobot para fazer pings regulares no seu site, mantendo-o ativo.

## Passos para Configurar o UptimeRobot

1. Crie uma conta gratuita em [UptimeRobot](https://uptimerobot.com/)

2. Após fazer login, clique em "Add New Monitor"

3. Configure o monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Movie Stars Battle (ou outro nome que preferir)
   - **URL (or IP)**: URL completa do seu site no Render (ex: https://movie-stars-battle.onrender.com)
   - **Monitoring Interval**: 5 minutos (o menor intervalo gratuito)

4. (Opcional) Para monitorar especificamente a saúde do banco de dados, use a rota de health check:
   - **URL (or IP)**: https://movie-stars-battle.onrender.com/health

5. Clique em "Create Monitor"

## Benefícios

- O serviço fará ping no seu site a cada 5 minutos
- Isso manterá o serviço ativo, evitando o spin down
- Reduz significativamente a perda de dados entre sessões
- Você receberá alertas se o site ficar offline

## Limitações

- O plano gratuito do UptimeRobot permite até 50 monitores
- O intervalo mínimo de monitoramento é de 5 minutos
- Mesmo com o monitoramento, pode haver spin down ocasional se o Render decidir liberar recursos

## Conclusão

Esta solução é um meio-termo entre usar o plano gratuito do Render (com perda de dados) e fazer upgrade para o plano pago (que permite configurar `minInstances: 1`).

Para persistência completa dos dados, recomendamos fortemente configurar o banco de dados PostgreSQL conforme explicado em `neon-setup.md` e `DEPLOY_RENDER.md`.