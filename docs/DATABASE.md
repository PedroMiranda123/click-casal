# Banco de Dados

Schema completo de `backend/prisma/schema.prisma`. Provider: PostgreSQL. ORM: Prisma 6.

## Modelos

### User

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| email | String | unique |
| passwordHash | String | bcrypt |
| createdAt | DateTime | default now() |

Relações: transactions, personEvents (CalendarEvent), createdEvents (CalendarEvent via "EventCreator"), shoppingItems, pushSubscriptions, notificationsReceived (NotificationLog), maintenanceLogs, workoutLogs, weeklyResultsWon (WeeklyResult), interests (UserInterest), relevances (EventSuggestionRelevance).

---

### PaymentMethod

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| type | PaymentMethodType | DEBIT \| CREDIT |
| isActive | Boolean | default true |

---

### Category

Categorias de **transações financeiras** (não confundir com CalendarCategory).

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| icon | String | |
| color | String | |
| isDefault | Boolean | default true |

---

### Transaction

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| paymentMethodId | String | FK → PaymentMethod |
| categoryId | String? | FK → Category (opcional) |
| type | TransactionType | INCOME \| EXPENSE |
| originalAmount | Int | em centavos/øre da moeda original |
| originalCurrency | Currency | DKK \| BRL |
| amountDkk | Int | valor convertido em øre DKK |
| exchangeRate | Decimal? | Decimal(10,6) — null se DKK |
| description | String? | |
| occurredAt | DateTime | |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | @updatedAt |

**Importante:** `balance` não é campo — calculado via `SUM(amountDkk)` no serviço de balance. Valores são inteiros em centavos/øre (ex: 10000 = 100,00 DKK).

---

### ExchangeRate

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| date | DateTime | @db.Date |
| fromCurrency | Currency | |
| toCurrency | Currency | |
| rate | Decimal | Decimal(14,8) |
| note | String? | |
| fetchedAt | DateTime | default now() |

Constraint: `@@unique([date, fromCurrency, toCurrency])` — taxa congelada na escrita, não atualizada.

---

### CalendarCategory

Categorias dinâmicas do calendário (cor + ícone). Substitui o antigo enum `EventType`.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| color | String | hex, ex: `#C99A3B` |
| icon | String | emoji ou string curta |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | @updatedAt |

---

### CalendarEvent

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| title | String | |
| categoryId | String | FK → CalendarCategory |
| personId | String? | FK → User — null = "Ambos" |
| startAt | DateTime | |
| allDay | Boolean | default true |
| recurrence | RecurrenceType | NONE \| YEARLY \| WEEKLY |
| recurrenceDays | Int[] | default [] — usado para WEEKLY (0=Dom..6=Sáb) |
| description | String? | |
| createdById | String | FK → User |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | @updatedAt |

**Importante:** Recorrência calculada em query time via `expandOccurrences()` em `src/lib/recurrence.js`. Não há modelo de exceção por ocorrência — editar edita o evento inteiro. Não existe mais enum `EventType` — usar CalendarCategory.

---

### ShoppingListItem

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| name | String | label em PT-BR |
| checked | Boolean | default false |
| matchedOfferId | String? | FK → FlyerOffer |
| matchedAt | DateTime? | quando o matching foi rodado |
| matchNote | String? | ex: "Encontrado como 'kylling' na Netto" |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | @updatedAt |

---

### FlyerOffer

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| externalId | String | unique — ID da Tjek API |
| dealerId | String | ID da loja na Tjek |
| dealerName | String | nome da loja |
| name | String | nome do produto em dinamarquês |
| priceOre | Int | preço em øre (1/100 DKK) |
| prePriceOre | Int? | preço anterior (desconto) |
| validFrom | DateTime | |
| validUntil | DateTime | |
| fetchedAt | DateTime | default now() |

---

### AiUsageLog

Loga cada chamada ao Gemini pelo event discovery.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| provider | String | "gemini" |
| model | String | ex: "gemini-3.5-flash" |
| service | String | "event-discovery" |
| inputTokens | Int | |
| outputTokens | Int | |
| createdAt | DateTime | default now() |

---

### PushSubscription

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| endpoint | String | unique — URL do endpoint do browser |
| p256dh | String | chave pública ECDH |
| auth | String | chave de autenticação |
| createdAt | DateTime | default now() |

---

### NotificationLog

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| type | NotificationType | EVENT_REMINDER \| POKE |
| calendarEventId | String? | referência ao evento (para EVENT_REMINDER) |
| reminderStage | ReminderStage? | DAY_BEFORE \| DAY_OF |
| pokeMessageId | String? | ID da mensagem de poke |
| fromUserId | String? | quem enviou (para POKE) |
| toUserId | String | FK → User |
| title | String | |
| body | String | |
| read | Boolean | default false |
| sentAt | DateTime | default now() |

---

### MaintenanceTask

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| title | String | |
| description | String | |
| frequency | String | DAILY \| WEEKLY \| MONTHLY \| SEMESTRAL \| YEARLY |
| category | String | ex: "Cozinha", "Banheiro", "Eletrodomésticos", "Geral" |
| order | Int | default 0 |
| isActive | Boolean | default true |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | @updatedAt |

---

### MaintenanceLog

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| taskId | String | FK → MaintenanceTask |
| doneById | String | FK → User |
| doneAt | DateTime | default now() |

---

### WorkoutLog

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| personId | String | FK → User |
| type | WorkoutType | MUSCULACAO \| CORRIDA \| NATACAO \| YOGA \| CAMINHADA \| FUTEBOL \| BASQUETE \| OUTRO |
| durationMinutes | Int? | |
| intensity | WorkoutIntensity? | LEVE \| MODERADO \| INTENSO |
| note | String? | |
| date | DateTime | |
| createdAt | DateTime | default now() |

---

### WeeklyResult

Fechamento automático de cada semana pelo serviço de fitness.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| weekStart | DateTime | unique — início da semana (segunda-feira) |
| countPedro | Int | treinos de Pedro na semana |
| countAna | Int | treinos de Ana na semana |
| winnerId | String? | FK → User — null se empate |
| createdAt | DateTime | default now() |

---

### UserInterest

Tags de interesse por usuário, usadas pelo Gemini para scoring.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| label | String | ex: "Jazz", "Teatro", "Filmes de ação" |
| createdAt | DateTime | default now() |

Constraint: `@@unique([userId, label])` — idempotente.

---

### EventSuggestion

Sugestão de evento ou filme vinda dos scrapers. Criada pelo discovery job.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| source | String | "ticketmaster" \| "hidden_nordvest" \| "nv_and_more" \| "kulturkbh" \| "tmdb" |
| externalId | String | unique — ID composto pelo scraper |
| title | String | |
| description | String? | |
| venueName | String? | |
| city | String? | |
| startAt | DateTime | data/hora do evento. Para MOVIE: data de estreia |
| url | String? | |
| imageUrl | String? | |
| category | String? | |
| kind | SuggestionKind | EVENT \| MOVIE |
| status | SuggestionStatus | NEW \| DISMISSED \| ADDED |
| createdAt | DateTime | default now() |

**Nota:** `cleanupJob.js` deleta registros com `startAt < hoje` toda segunda 3h. Frontend também filtra client-side.

---

### EventSuggestionRelevance

Row de relevância por usuário para cada sugestão. Criada pelo Gemini após scoring.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (cuid) | PK |
| eventSuggestionId | String | FK → EventSuggestion (cascade delete) |
| userId | String | FK → User |
| reason | String? | Motivo da relevância em PT-BR, gerado pelo Gemini |

Constraint: `@@unique([eventSuggestionId, userId])`.

---

## Enums

| Enum | Valores |
|------|---------|
| PaymentMethodType | DEBIT, CREDIT |
| TransactionType | INCOME, EXPENSE |
| Currency | DKK, BRL |
| RecurrenceType | NONE, YEARLY, WEEKLY |
| NotificationType | EVENT_REMINDER, POKE |
| ReminderStage | DAY_BEFORE, DAY_OF |
| SuggestionKind | EVENT, MOVIE |
| SuggestionStatus | NEW, DISMISSED, ADDED |
| WorkoutType | MUSCULACAO, CORRIDA, NATACAO, YOGA, CAMINHADA, FUTEBOL, BASQUETE, OUTRO |
| WorkoutIntensity | LEVE, MODERADO, INTENSO |

**Removido:** enum `EventType` (BIRTHDAY, PAYMENT_DUE, SPORTS, EXERCISE, GENERAL) — substituído por `CalendarCategory` dinâmica.

## Migrações

```bash
# Aplicar em produção (já roda automaticamente no start do backend)
# Mas se precisar manualmente dentro do container:
docker exec -it <container-id> npx prisma migrate deploy

# Seed
docker exec -it <container-id> npx prisma db seed
# Seed script: backend/prisma/seed.js
```

**Nota:** o `start` script do backend já é `npx prisma migrate deploy && node server.js` — migrações sobem automaticamente com o container.
