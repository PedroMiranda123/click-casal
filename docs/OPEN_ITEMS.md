# Itens em Aberto

Atualizar neste arquivo após cada sessão.

## Alta prioridade

- [ ] Confirmar visualmente que o fix do background do date input no iOS está correto no calendário
- [ ] Testar delete de transação e evento end-to-end (especialmente a confirmação inline PT-BR)
- [ ] Mergear `feature/design-system-unification` para main após testes locais — contém event discovery completo, fitness, manutenção, novas categorias de calendário

## Média prioridade

- [ ] Toggle de visibilidade financeira (Item 1) — implementado mas em stash no main, aplicar após merge da feature branch
- [ ] Adicionar job de frontend ao CI (`.github/workflows/ci.yml`) — atualmente TypeScript errors só aparecem no deploy
- [ ] Considerar: resize do servidor Hetzner para mais RAM (swap é rede de segurança, não solução permanente)
- [ ] Verificar se `@anthropic-ai/sdk` ainda é necessário nas deps do backend — grocery matching virou dicionário, pode ser removido
- [ ] Confirmar schedule exato do cron de lembretes de eventos em `src/jobs/reminderJob.js`

## Baixa prioridade

- [ ] Viagens / Jogos — cards "Em breve" no HubPage, sem implementação ainda

## Resolvido (não limpar — histórico útil)

- [x] ~~Wire `prisma migrate deploy` no script `start` do backend~~ — já estava no script
- [x] ~~Switch de AI matching → dictionary matching na lista de compras~~ — `src/services/groceryMatching.js` usa `GROCERY_TERMS` dictionary
- [x] Folhetos e Ofertas movidos para dentro de /compras como tabs (PR #17)
- [x] Fix redirect para home após login (PR #16)
- [x] Cron semanal de folhetos e wire-up do Tjek API (PR #16)
- [x] ~~AiUsageLog sem uso~~ — está sendo usado pelo Gemini no event discovery. Campos atualizados: provider, model, service, inputTokens, outputTokens
- [x] ~~Event discovery pausado~~ — totalmente implementado na feature branch: 5 fontes, Gemini scoring, EventSuggestion/EventSuggestionRelevance/UserInterest no schema
- [x] Bug geminiMatcher: existingIdMap lookup falhava porque Gemini truncava externalIds longos — corrigido usando índices numéricos no prompt e resolvendo de volta ao externalId via batch[idx]
- [x] Filtro de eventos passados no EventosPage (client-side: startAt >= startOfToday)
- [x] cleanupJob.js: cron 3h segunda Europe/Copenhagen, deleta EventSuggestion com startAt < hoje
