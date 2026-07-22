# Arquitetura

## Visão geral

```
                 ┌──────────────────────────────────────────────┐
                 │          Hetzner Cloud (46.62.232.76)         │
                 │                                              │
  Browser/PWA ──►│  Traefik (SSL Let's Encrypt, portas 80/443)  │
                 │       │                      │               │
                 │       ▼                      ▼               │
                 │  nginx:alpine         node:20-alpine         │
                 │  clickcasal.com.br    api.clickcasal.com.br  │
                 │  (frontend SPA)       Express 5, porta 3000  │
                 │                              │               │
                 │                              ▼               │
                 │                      PostgreSQL (Dokploy)    │
                 └──────────────────────────────────────────────┘
                              Dokploy (Docker Swarm)
```

## Backend

- **Entry point:** `backend/server.js` → require `./index` (Express app) → listen
- **App module:** `backend/index.js` — middlewares + rotas registradas
- **Porta:** `process.env.PORT || 3000`
- **Framework:** Express 5
- **ORM:** Prisma 6 (cliente auto-gerado)
- **Migrações no boot:** `start` script já inclui `npx prisma migrate deploy`

### Middlewares globais

- `helmet` — headers de segurança
- `cors` — origin: `FRONTEND_URL` env, credentials: true
- `express.json` — body parsing
- `cookie-parser` — leitura dos cookies JWT
- `authenticate` (middleware customizado) — verifica `access_token` cookie

### Rotas principais

| Prefixo | Arquivo |
|---------|---------|
| `/auth` | `src/routes/auth.js` |
| `/transactions` | `src/routes/transactions.js` |
| `/balance` | `src/routes/balance.js` |
| `/categories` | `src/routes/categories.js` (categorias de transações) |
| `/calendar-categories` | `src/routes/calendarCategories.js` (categorias dinâmicas do calendário) |
| `/payment-methods` | `src/routes/paymentMethods.js` |
| `/events` | `src/routes/events.js` |
| `/users` | `src/routes/users.js` |
| `/shopping-list` | `src/routes/shoppingList.js` |
| `/flyers` | `src/routes/flyers.js` |
| `/push` | `src/routes/push.js` |
| `/api/maintenance` | `src/routes/maintenance.js` |
| `/fitness` | `src/routes/fitness.js` |
| `/api/interests` | `src/routes/interests.js` |
| `/api/event-suggestions` | `src/routes/eventSuggestions.js` |
| `/api/internal` | `src/routes/internal.js` (protegido por INTERNAL_JOB_SECRET, sem auth de usuário) |

### Jobs (crons via node-cron, registrados em `backend/server.js`)

| Job | Arquivo | Schedule |
|-----|---------|----------|
| Lembretes de eventos | `src/jobs/reminderJob.js` | ver arquivo para schedule exato |
| Atualização de folhetos | `src/jobs/flyerOffersJob.js` | `0 4 * * 1` — 4h segunda, Europe/Copenhagen |
| Limpeza de eventos passados | `src/jobs/cleanupJob.js` | `0 3 * * 1` — 3h segunda, Europe/Copenhagen |

**Nota:** O job de event discovery NÃO é node-cron — é acionado externamente via Dokploy HTTP Schedule → `POST /api/internal/run-discovery`.

### Serviços

| Serviço | Arquivo | Responsabilidade |
|---------|---------|-----------------|
| exchangeRate | `src/services/exchangeRate.js` | Busca/cacheia taxa BRL→DKK |
| balance | `src/services/balance.js` | SUM de transactions em DKK |
| summary | `src/services/summary.js` | Resumo mensal de transações |
| groceryMatching | `src/services/groceryMatching.js` | Dictionary matching PT-BR→DA |
| flyerOffers | `src/services/flyerOffers.js` | Upsert de FlyerOffer via Tjek API |
| fitness | `src/services/fitness.js` | Streaks, WeeklyResult, contagem semanal |
| discovery/index | `src/services/discovery/index.js` | Agrega todos os scrapers/sources |
| discovery/kulturkbh | `src/services/discovery/kulturkbh.js` | kulturkbh.dk JSON feed |
| discovery/hiddenNordvest | `src/services/discovery/hiddenNordvest.js` | Google Calendar iCal público |
| discovery/nvAndMore | `src/services/discovery/nvAndMore.js` | HTML scrape |
| discovery/ticketmaster | `src/services/discovery/ticketmaster.js` | Ticketmaster Discovery API |
| discovery/tmdb | `src/services/discovery/tmdb.js` | TMDB API (filmes) |
| discovery/geminiMatcher | `src/services/discovery/geminiMatcher.js` | Scoring Gemini AI por batch, usa índices numéricos no prompt |
| discovery/runDiscovery | `src/services/discovery/runDiscovery.js` | Orquestra fetch → dedup → store → score |

## Frontend

- **Entry point:** `frontend/src/main.tsx`
- **App:** `frontend/src/App.tsx`
- **Language:** TypeScript
- **Router:** React Router v6 (SPA — nginx fallback para index.html via `nginx.conf`)
- **PWA:** `vite-plugin-pwa` com `injectManifest`, service worker em `src/sw.ts`
- **Build:** multi-stage Dockerfile — `node:20-alpine` build → `nginx:alpine` serve (porta 80)
- **Manifest:** definido inline em `vite.config.ts` (sem `public/manifest.json`)
- **Dev proxy:** `/api` → `http://localhost:3000` (somente local)

### Páginas e rotas

| Rota | Página | Notas |
|------|--------|-------|
| `/login` | LoginPage | Pública |
| `/` | HubPage | Hub central |
| `/financas` | DashboardPage | Transações, saldo, toggle de visibilidade financeira |
| `/calendario` | CalendarPage | Eventos + recorrência + CalendarCategory |
| `/manutencao` | ManutencaoPage | Tarefas de manutenção da casa |
| `/fitness` | FitnessPage | WorkoutLog, streaks, weekly win |
| `/eventos` | EventosPage | Sugestões de eventos (kind=EVENT) com tabs de status |
| `/eventos/filmes` | EventosFilmesPage | Sugestões de filmes (kind=MOVIE) |
| `/eventos/interesses` | InteressesPage | Gestão de tags de interesse por usuário |
| `/compras` | ShoppingListPage | Lista de compras (layout com tabs) |
| `/compras/ofertas` | OfertasPage | Nested: ofertas por loja |
| `/compras/folhetos` | FolhetosPage | Nested: catálogos (capas) |

## Banco de dados

Postgres separado do Postgres interno do Dokploy. Conexão via `DATABASE_URL` env. Schema gerenciado pelo Prisma.

## Deploy

- Push para `main` → webhook Dokploy → rebuild automático
- Migrações rodam no boot do backend (já no `start` script)
- Env vars: definir no Dokploy + redeploy para aplicar
- Frontend build: `npm run prebuild` (create-icons.mjs) + `tsc -b && vite build`
