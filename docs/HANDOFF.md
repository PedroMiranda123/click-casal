# Handoff — Como Começar uma Nova Sessão

Cole isso no início de cada conversa nova com Claude:

---

**[INÍCIO DO PASTE]**

Estou trabalhando no Click Casal — PWA privado para Pedro e Ana (gestão de finanças, calendário, lista de compras, manutenção da casa, fitness e descoberta de eventos/filmes).

**Repo:** `github.com/PedroMiranda123/click-casal`  
**Stack:** Node.js/Express 5 + Prisma 6 + PostgreSQL · React 18/Vite + TypeScript + Tailwind · PWA  
**Servidor:** Hetzner Cloud `46.62.232.76` · Dokploy (Docker Swarm) · Traefik  
**Domínios:** `clickcasal.com.br` (frontend) · `api.clickcasal.com.br` (backend)  
**Auth:** JWT — 2 cookies httpOnly (`access_token` 15min + `refresh_token` 7 dias) · 2 usuários fixos · sem signup público · UI em PT-BR  

**Docs de referência** (ler antes de qualquer coisa):
- `docs/CONTEXT.md` — features e estado atual
- `docs/ARCHITECTURE.md` — estrutura do sistema, rotas, crons, serviços
- `docs/DATABASE.md` — schema Prisma completo (18+ modelos)
- `docs/API.md` — todas as rotas do backend com body/response
- `docs/DESIGN_SYSTEM.md` — tokens, fontes, padrões de interação
- `docs/INFRA.md` — servidor, Dokploy, quirks, comandos úteis

**Branch atual:** [diga qual branch ou 'main' se começando do zero]

**O que preciso hoje:** [descreva o que quer fazer]

**[FIM DO PASTE]**

---

## Como trabalhamos

- Não rodar testes de frontend via browser (Claude Code) — Pedro testa local
- Nenhum commit antes de Pedro confirmar teste local
- Branch por feature, deletar após merge

## Notas de fluxo

- Migrações: o `start` do backend já roda `prisma migrate deploy` — não é mais necessário rodar manualmente após deploy normal
- Se precisar rodar migration manualmente: `docker exec -it <container-id> npx prisma migrate deploy`
- Env vars novas: definir no Dokploy → Redeploy (salvar sem redeploy não aplica)
- CI só roda backend — TypeScript errors no frontend só aparecem no build do Dokploy
- Cloud sessions do Claude Code → `git push` falha com 403. Usar Local session no Claude Desktop
- Event discovery cron: configurado no Dokploy Schedules (HTTP POST) — não é node-cron interno
- CalendarEvent usa `CalendarCategory` (modelo dinâmico) — não existe mais enum `EventType`
