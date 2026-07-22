# API Reference

Base URL: `https://api.clickcasal.com.br`

Auth: dois cookies httpOnly (definidos pelo servidor no login):
- `access_token` — JWT de acesso, expira em 15 minutos
- `refresh_token` — JWT de refresh, expira em 7 dias

Todas as rotas exceto `POST /auth/login` e `POST /auth/refresh` requerem autenticação (cookie `access_token` válido).

---

## Auth — `/auth`

### `POST /auth/login`
Sem auth. Rate limit: 5 req/15min por IP.

Body:
```json
{ "email": "string", "password": "string" }
```

Response 200:
```json
{ "id": "string", "name": "string", "email": "string" }
```
(Seta cookies `access_token` e `refresh_token`.)

Errors: 401 `{ "error": "Invalid credentials" }`

---

### `POST /auth/refresh`
Sem auth. Usa cookie `refresh_token`.

Response 200: `{ "ok": true }` (renova o cookie `access_token`.)

Errors: 401 `{ "error": "Not authenticated" }`

---

### `GET /auth/me`
Auth obrigatória.

Response 200: `{ "id": "string", "name": "string", "email": "string" }`

---

### `POST /auth/logout`
Auth não verificada (apenas limpa cookies).

Response 200: `{ "ok": true }`

---

## Transactions — `/transactions`

### `POST /transactions`
Cria transação. Converte BRL→DKK automaticamente via ExchangeRate.

Body:
```json
{
  "type": "INCOME | EXPENSE",
  "originalAmount": 10000,
  "originalCurrency": "DKK | BRL",
  "paymentMethodId": "string",
  "categoryId": "string (opcional)",
  "description": "string (opcional)",
  "occurredAt": "ISO datetime"
}
```

Response 201: objeto Transaction completo.

Errors: 400 validation, 422 se taxa de câmbio indisponível.

---

### `GET /transactions`
Lista com paginação e filtros.

Query params:
- `from`, `to` — ISO datetime (filtro occurredAt)
- `categoryId`, `paymentMethodId` — filtros por ID
- `type` — `INCOME | EXPENSE`
- `page` (default 1), `limit` (default 20, max 100)

Response 200:
```json
{
  "data": [Transaction],
  "pagination": { "page": 1, "limit": 20, "total": 42 }
}
```

---

### `GET /transactions/summary`
Resumo mensal.

Query params: `month` — formato `YYYY-MM`

Response 200: ⚠️ shape definida em `src/services/summary.js` — confirmar campos.

---

### `GET /transactions/:id`
Response 200: objeto Transaction. 404 se não encontrado.

---

### `PATCH /transactions/:id`
Atualiza campos parcialmente (merge com existente antes de revalidar).

Body: qualquer subconjunto dos campos de criação.

Response 200: objeto Transaction atualizado.

---

### `DELETE /transactions/:id`
Response 204. 404 se não encontrado.

---

## Balance — `/balance`

### `GET /balance`
Saldo total da conta (calculado via SUM, não armazenado).

Response 200: `{ "balanceDkk": 123456 }` (valor em øre)

---

## Categories — `/categories`

### `GET /categories`
Lista todas as categorias ordenadas por nome.

Response 200: `[{ "id": "string", "name": "string", "icon": "string", "color": "string", "isDefault": true }]`

---

## Payment Methods — `/payment-methods`

### `GET /payment-methods`
Lista métodos de pagamento ativos.

Response 200: `[{ "id": "string", "name": "string", "type": "DEBIT | CREDIT", "isActive": true }]`

---

## Events — `/events`

### `GET /events`
Lista eventos expandindo recorrência para o intervalo solicitado.

Query params obrigatórios: `from`, `to` — ISO datetime

Response 200: array de ocorrências (cada uma inclui `person: {id, name}` e `createdBy: {id, name}`).

---

### `POST /events`
Body:
```json
{
  "title": "string",
  "type": "BIRTHDAY | PAYMENT_DUE | SPORTS | EXERCISE | GENERAL",
  "personId": "string (opcional — null = Ambos)",
  "startAt": "ISO datetime",
  "allDay": true,
  "recurrence": "NONE | YEARLY | WEEKLY",
  "recurrenceDays": [0,1,2,3,4,5,6],
  "description": "string (opcional)"
}
```

Response 201: objeto CalendarEvent com person e createdBy.

---

### `PATCH /events/:id`
Body: subconjunto dos campos de criação.

Response 200: objeto CalendarEvent atualizado.

---

### `DELETE /events/:id`
Response 204. 404 se não encontrado.

---

## Users — `/users`

### `GET /users`
Lista todos os usuários (para seletor de pessoa no calendário).

Response 200: `[{ "id": "string", "name": "string" }]`

---

## Shopping List — `/shopping-list`

### `GET /shopping-list`
Lista itens do usuário autenticado com oferta matchada.

Response 200: `[ShoppingListItem & { matchedOffer: FlyerOffer | null }]`

---

### `POST /shopping-list`
Cria item e dispara dictionary matching em background (não bloqueia resposta).

Body: `{ "name": "string (max 200)" }`

Response 201: `ShoppingListItem & { matchedOffer: null }` (match chega depois via cron/update).

---

### `PATCH /shopping-list/:id`
Body: `{ "name": "string (opcional)", "checked": boolean (opcional) }`

Response 200: item atualizado com matchedOffer.

---

### `DELETE /shopping-list/:id`
Response 204. 404 se não encontrado ou não pertence ao usuário.

---

## Flyers — `/flyers`

Proxy para a Tjek API. Lojas configuradas em `src/config/stores.js`.

### `GET /flyers/offers?dealer_id=<id>`
Retorna até 100 ofertas de uma loja.

Response 200:
```json
[{
  "id": "string",
  "name": "string",
  "description": "string | null",
  "priceOre": 2999,
  "prePriceOre": 3999,
  "validFrom": "ISO",
  "validUntil": "ISO",
  "imageUrl": "string | null",
  "dealerName": "string",
  "dealerColor": "string"
}]
```

Errors: 400 `dealer_id` desconhecido, 502 erro na Tjek API.

---

### `GET /flyers/catalogs`
Lista o catálogo mais recente de cada loja configurada.

Response 200:
```json
[{
  "id": "string",
  "dealerId": "string",
  "dealerName": "string",
  "dealerColor": "string",
  "label": "string",
  "runFrom": "ISO",
  "runTill": "ISO",
  "pageCount": 24,
  "offerCount": 180,
  "coverThumb": "url | null",
  "coverView": "url | null"
}]
```

---

### `GET /flyers/catalogs/:id/pages`
Retorna todas as URLs de imagem de página de um catálogo.

Response 200: array de objetos de página (estrutura da Tjek API, passado direto).

---

## Push Notifications — `/push`

### `GET /push/poke-messages`
Lista mensagens de poke disponíveis.

Response 200: `[{ "id": "string", "text": "string", "emoji": "string" }]`

---

### `POST /push/subscribe`
Registra subscription de Web Push para o usuário autenticado.

Body:
```json
{
  "endpoint": "string",
  "keys": { "p256dh": "string", "auth": "string" }
}
```

Response 201: `{ "ok": true }` (upsert — atualiza se endpoint já existe).

---

### `POST /push/unsubscribe`
Remove subscription.

Body: `{ "endpoint": "string" }`

Response 204.

---

### `POST /push/poke`
Envia push notification de cutucada ao parceiro. Rate limit: 5 pokes/min.

Body: `{ "messageId": "string" }`

Response 200: `{ "ok": true }`

Errors: 400 messageId inválido, 429 rate limit atingido.

---

### `GET /push/notifications`
Retorna 50 notificações mais recentes do usuário autenticado.

Response 200: `[{ "id", "type", "title", "body", "read", "sentAt", "fromUserId" }]`

---

### `GET /push/notifications/unread-count`
Response 200: `{ "count": 3 }`

---

### `POST /push/notifications/:id/read`
Marca notificação como lida.

Response 200: `{ "ok": true }`. 404 se não encontrada ou não pertence ao usuário.

---

### `POST /push/notifications/read-all`
Marca todas as notificações não lidas como lidas.

Response 200: `{ "ok": true, "count": 5 }`

---

## Calendar Categories — `/calendar-categories`

Categorias dinâmicas do calendário (substituem o antigo enum EventType).

### `GET /calendar-categories`
Response 200: `[{ "id", "name", "color", "icon", "createdAt", "updatedAt" }]`

---

### `POST /calendar-categories`
Body: `{ "name": "string", "color": "#RRGGBB", "icon": "string (emoji)" }`

Response 201: objeto CalendarCategory criado.

---

### `PATCH /calendar-categories/:id`
Body: subconjunto dos campos de criação.

Response 200: objeto atualizado.

---

### `DELETE /calendar-categories/:id`
Response 204. 404 se não encontrado.

---

## Maintenance — `/api/maintenance`

### `GET /api/maintenance/tasks`
Lista todas as tarefas ativas com o último log de cada uma.

Response 200:
```json
[{
  "id": "string",
  "title": "string",
  "description": "string",
  "frequency": "DAILY | WEEKLY | MONTHLY | SEMESTRAL | YEARLY",
  "category": "string",
  "order": 0,
  "isActive": true,
  "logs": [{ "id", "doneAt", "doneBy": { "id", "name" } }]
}]
```

---

### `POST /api/maintenance/tasks/:id/log`
Registra conclusão da tarefa pelo usuário autenticado.

Response 201: `{ "id", "taskId", "doneAt", "doneBy": { "id", "name" } }`

---

## Fitness — `/fitness`

### `GET /fitness/logs`
Query params opcionais: `personId`, `from` (ISO), `to` (ISO).

Response 200: `[WorkoutLog & { person: { id, name } }]` ordenado por date desc.

---

### `POST /fitness/logs`
Body:
```json
{
  "type": "MUSCULACAO | CORRIDA | NATACAO | YOGA | CAMINHADA | FUTEBOL | BASQUETE | OUTRO",
  "durationMinutes": 60,
  "intensity": "LEVE | MODERADO | INTENSO",
  "note": "string (opcional)",
  "date": "ISO datetime"
}
```

Response 201: objeto WorkoutLog com person.

---

### `DELETE /fitness/logs/:id`
Response 204. 404 se não encontrado.

---

### `GET /fitness/stats`
Fecha a semana anterior se ainda aberta, depois retorna:

Response 200:
```json
{
  "streaks": { "pedro": { "current": 3, "best": 7 }, "ana": { ... } },
  "currentWeek": { "pedro": 2, "ana": 3 },
  "weeklyWins": { "pedro": 5, "ana": 4 },
  "recentWeeklyResults": [{ "weekStart", "countPedro", "countAna", "winner": { "id", "name" } | null }]
}
```

---

## Interests — `/api/interests`

Tags de interesse do usuário para personalização do scoring Gemini.

### `GET /api/interests`
Response 200: `[{ "id", "userId", "label", "createdAt" }]` do usuário autenticado, ordem alfabética.

---

### `POST /api/interests`
Body: `{ "label": "string (max 100)" }`

Idempotente via upsert — não duplica se label já existe.

Response 201: objeto UserInterest.

---

### `DELETE /api/interests/:id`
Response `{ "ok": true }`. 404 se não encontrado, 403 se não pertence ao usuário.

---

## Event Suggestions — `/api/event-suggestions`

### `GET /api/event-suggestions`
Query params:
- `kind` — `EVENT | MOVIE` (obrigatório)
- `status` — `NEW | DISMISSED | ADDED` (opcional — omitir retorna todos)

Retorna sugestões com o campo `reason` da relevância do usuário autenticado (null se não houver).

Response 200: `[{ "id", "source", "title", "description", "venueName", "city", "startAt", "url", "imageUrl", "category", "kind", "status", "reason" }]`

---

### `PATCH /api/event-suggestions/:id/status`
Atualiza status de uma sugestão. Requer que exista uma linha de relevância para o usuário (ou seja, o Gemini marcou como relevante).

Body: `{ "status": "ADDED | DISMISSED" }`

Response 200: objeto EventSuggestion atualizado.

---

## Internal — `/api/internal`

Protegido por header `Authorization: Bearer <INTERNAL_JOB_SECRET>`. Sem auth de usuário.

### `POST /api/internal/run-discovery`
Dispara o job de discovery assincronamente (responde imediatamente).

Response 200: `{ "ok": true, "message": "Discovery job started" }`

Configurado no Dokploy Schedules como HTTP Schedule semanal.
