# Design System

## Aesthetic

"Liquid glass" — light theme. Painéis translúcidos com `backdrop-filter: blur(20-24px) saturate(160%)`. Gradiente de fundo: azul nórdico + areia/coral (referência Brasil-na-Dinamarca). Glass pesado apenas em 2-3 superfícies hero por tela. Conteúdo denso fica flat.

**Sem verde em nenhuma parte da paleta.**

## Tokens

```css
--ink: #1B2A38;
--ink-dim: rgba(27,42,56,0.56);
--ink-faint: rgba(27,42,56,0.36);
--glass: rgba(255,255,255,0.55);
--glass-strong: rgba(255,255,255,0.75);
--glass-border: rgba(255,255,255,0.85);
--blue: #2E6FA3;    /* positivo/receita */
--coral: #C9613D;   /* despesa/negativo */
--gold: #C99A3B;    /* acento principal — CTA, FAB, linha de pulso */
--plum: #8B6F9E;    /* acento secundário */
```

Fundo da página: gradiente azul nórdico → areia/coral.  
PWA theme_color: `#EAF2FB` (azul nórdico claro).  
PWA background_color: `#FCEFE3` (areia/coral).

## Fontes

- **Fraunces** — display/serif — números hero, títulos de página
- **Plus Jakarta Sans** — corpo/UI
- **JetBrains Mono** (tabular numerals) — qualquer valor monetário em lista

## Ícone do app

Silhueta de casa (ink navy) + coração (coral-tint `#F0B49A`) + lua crescente (gold). Coordenadas SVG em `frontend/scripts/create-icons.mjs`. Gerado como pre-build step (`npm run prebuild`). Produz `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-512-maskable.png`.

## Cores do calendário

O calendário usa `CalendarCategory` dinâmica (não mais um enum `EventType`). Cada categoria tem `color` (hex) e `icon` (emoji) definidos pelo usuário. As cores sugeridas para as categorias seed são os tokens do design system (`--gold`, `--coral`, `--blue`, `--plum`).

## Padrão de interação

- FAB dourado circular, canto inferior direito, em todas as seções
- Abre bottom sheet para adicionar item
- Finanças e Calendário: input de texto livre PT-BR com parsing + chip de confirmação
- Lista de compras: só campo de label
- Delete: swipe/long-press com confirmação inline em PT-BR
- Tabs de status (Todos/Novas/Salvas/Descartadas) na seção de eventos

## PWA

- `display: standalone` — sem barra do browser
- `start_url: /`
- Service worker: `src/sw.ts` (Workbox, estratégia `injectManifest`, network-first para `api.clickcasal.com.br`)
- Auto-update: `registerType: 'autoUpdate'`
