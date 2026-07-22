# Click Casal — Contexto do Projeto

PWA privado para Pedro e Ana. Gestão de finanças, calendário, lista de compras, manutenção da casa, fitness e descoberta de eventos/filmes. 2 usuários fixos, sem cadastro público, sem papéis/roles. UI em PT-BR. Moeda principal: DKK. BRL suportado com conversão histórica.

**Repo:** github.com/PedroMiranda123/click-casal  
**Stack:** Node.js/Express 5 + Prisma 6 + PostgreSQL (backend) · React 18/Vite + Tailwind + TypeScript (frontend)  
**Deploy:** Hetzner Cloud (`46.62.232.76`) · Dokploy (Docker Swarm) · Traefik (SSL via Let's Encrypt)  
**Domínios:** `clickcasal.com.br` (frontend) · `api.clickcasal.com.br` (backend)  
**Auth:** JWT em dois httpOnly cookies (`access_token` 15min + `refresh_token` 7 dias). 2 usuários seed. Sem signup público.

## Features e status atual

| Feature | Status | Notas |
|---------|--------|-------|
| Auth (login/refresh/logout) | ✅ | 2 cookies httpOnly. Rate limit: 5 tentativas/15min |
| Finanças (transações, saldo) | ✅ | CRUD completo. Saldo calculado via SUM, não armazenado |
| Toggle visibilidade financeira | 🔄 | Implementado em branch/stash, ainda não mergeado para main |
| Calendário (mensal, recorrência) | ✅ | Categorias dinâmicas (CalendarCategory — cor + ícone). Recorrência NONE/YEARLY/WEEKLY expandida em query time |
| Lista de compras | ✅ | CRUD + dictionary matching PT-BR→DA automático ao adicionar item |
| Folhetos (catálogos Tjek API) | ✅ | GET /flyers/catalogs — mostra capas de lojas configuradas |
| Ofertas (offers Tjek API) | ✅ | GET /flyers/offers?dealer_id=X — ofertas por loja |
| Push notifications | ✅ | Web Push: lembretes de eventos + poke entre usuários |
| Poke (cutucada) | ✅ | Rate limit 5/min. Envia push para o parceiro |
| Notificações inbox | ✅ | GET /push/notifications + marcar lidas |
| Lembrete de eventos | ✅ | Cron: dispara na véspera (DAY_BEFORE) e no dia (DAY_OF) |
| Cron semanal de folhetos | ✅ | 4h segunda-feira Europe/Copenhagen — atualiza FlyerOffer + re-match |
| Manutenção da casa | ✅ | Tarefas com frequência (DAILY/WEEKLY/MONTHLY/SEMESTRAL/YEARLY) + log de conclusão por usuário |
| Fitness / Treinos | ✅ | WorkoutLog por pessoa (tipo, duração, intensidade). Streaks, contagem semanal, WeeklyResult com vencedor |
| Interesses dos usuários | ✅ | Tags por usuário para personalização do scoring Gemini |
| Event discovery — Eventos | ✅ | Fontes: KulturKBH, Hidden Nordvest (iCal), NV & More (HTML), Ticketmaster. Scoring Gemini. Filtro client-side de eventos passados |
| Event discovery — Filmes | ✅ | Fonte: TMDB. Mesmo pipeline de scoring Gemini |
| Cron semanal de discovery | ✅ | Dokploy HTTP Schedule → POST /api/internal/run-discovery. Não é node-cron interno |
| Cron limpeza semanal | ✅ | 3h segunda-feira Europe/Copenhagen — deleta EventSuggestion com startAt < hoje |

## Notas importantes

- AI de grocery matching virou dicionário — `@anthropic-ai/sdk` nas deps do backend pode ser removido.
- CI só roda backend tests — não existe job de frontend no CI.
- `start` script do backend já inclui `npx prisma migrate deploy` antes de subir o servidor.
- Event discovery usa Gemini 2.5 Flash via HTTP direto (não SDK Anthropic). Cada chamada é logada em `AiUsageLog` (campos: provider, model, service, inputTokens, outputTokens).
- CalendarEvent usa `CalendarCategory` (modelo dinâmico com cor/ícone) — não mais um enum `EventType`.

## Itens em aberto

Ver `docs/OPEN_ITEMS.md` para lista atualizada.
