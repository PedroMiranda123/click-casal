export interface ParsedExpense {
  /** Amount in minor units (øre / centavos) */
  amount: number;
  currency: 'DKK' | 'BRL';
  type: 'INCOME' | 'EXPENSE';
  /** Matched category name, or null if no confident match */
  categoryName: string | null;
  description: string;
}

export type ParseResult =
  | { ok: true; data: ParsedExpense }
  | { ok: false; error: string };

// ─── Currency detection ──────────────────────────────────────────────────────

// r$ uses no \b because $ is not a word character — word boundary fails after it
const BRL_TOKENS = /\b(reais|brl)\b|r\$/i;
const DKK_TOKENS = /\b(kr|coroas|dkk|kronas?)\b/i;

function detectCurrency(text: string): 'DKK' | 'BRL' {
  if (BRL_TOKENS.test(text)) return 'BRL';
  return 'DKK'; // default
}

// ─── Transaction type detection ──────────────────────────────────────────────

const INCOME_TOKENS = /\b(recebi|ganhei|caiu|entrou|recebeu)\b/i;

function detectType(text: string): 'INCOME' | 'EXPENSE' {
  return INCOME_TOKENS.test(text) ? 'INCOME' : 'EXPENSE';
}

// ─── Amount extraction ───────────────────────────────────────────────────────

// Matches numbers like: 250, 45,90, 45.90, 1.250,00, 1250.00
const AMOUNT_RE = /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\b/;

function extractAmount(text: string): { amount: number; rest: string } | null {
  const match = AMOUNT_RE.exec(text);
  if (!match) return null;

  // Normalize: if there's a comma used as decimal separator (e.g. "45,90")
  // vs a period as decimal separator (e.g. "45.90") vs thousands separator.
  let raw = match[1];

  // Detect if the last separator is decimal: "45,90" or "45.90" (2 digits after sep)
  const lastSepMatch = /[.,](\d+)$/.exec(raw);
  if (lastSepMatch) {
    const decimals = lastSepMatch[1];
    if (decimals.length <= 2) {
      // Last separator is decimal — strip thousands separators and use "." as decimal
      raw = raw.replace(/[.,](?=\d{3})/g, '').replace(',', '.');
    } else {
      // 3-digit group after separator means it's a thousands separator, no decimals
      raw = raw.replace(/[.,]/g, '');
    }
  }

  const float = parseFloat(raw);
  if (Number.isNaN(float) || float <= 0) return null;

  const amount = Math.round(float * 100);
  const rest = text.slice(0, match.index) + text.slice(match.index + match[0].length);
  return { amount, rest };
}

// ─── Category keyword matching ───────────────────────────────────────────────

const CATEGORY_KEYWORDS: Array<{ name: string; patterns: RegExp }> = [
  {
    name: 'Supermercado',
    patterns: /\b(netto|rema|bilka|foetex|føtex|lidl|aldi|supermercado|mercado|coop|meny|spar|fakta|irma|irmã|fakta)\b/i,
  },
  {
    name: 'Delivery / Restaurante',
    patterns: /\b(ifood|rappi|ubereats|just.?eat|wolt|restaurante|pizza|sushi|hamburguer|burger|lanche|caf[eé]|bar|padaria|delivery)\b/i,
  },
  {
    name: 'Transporte',
    patterns: /\b(uber|metro|metr[oô]|trem|bus|[oô]nibus|dsb|rejsekort|bicicleta|movia|taxa|cabify|99|lyft|transport)\b/i,
  },
  {
    name: 'Moradia',
    patterns: /\b(aluguel|rent|condom[ií]nio|aluguer|hus|bolig)\b/i,
  },
  {
    name: 'Contas',
    patterns: /\b(netflix|spotify|internet|telefone|luz|[áa]gua|g[aá]s|energia|conta|assinatura|hbo|disney|amazon\s*prime)\b/i,
  },
  {
    name: 'Saúde',
    patterns: /\b(farm[áa]cia|m[eé]dico|hospital|consulta|rem[eé]dio|apo[tT]ek|l[aæ]ge|tandl[aæ]ge)\b/i,
  },
  {
    name: 'Academia / Esportes',
    patterns: /\b(academia|gym|fitness|esporte|natação|crossfit|sats|fitness\s*dk)\b/i,
  },
  {
    name: 'Lazer / Entretenimento',
    patterns: /\b(cinema|teatro|show|ingresso|games|jogo|museu|concerto|bilhete)\b/i,
  },
  {
    name: 'Vestuário',
    patterns: /\b(roupa|sapato|t[eê]nis|zara|h&m|hm|mango|vero\s*moda|selected|jack\s*&\s*jones)\b/i,
  },
  {
    name: 'Viagem',
    patterns: /\b(voo|avi[aã]o|hotel|airbnb|hostel|passagem|passagem|rejse|flyv)\b/i,
  },
  {
    name: 'Pet',
    patterns: /\b(ra[çc][aã]o|veterin[aá]rio|petshop|pet\s*shop|dyrlæge|hund|kat)\b/i,
  },
];

function guessCategory(text: string): string | null {
  for (const cat of CATEGORY_KEYWORDS) {
    if (cat.patterns.test(text)) return cat.name;
  }
  return null;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

// Words to strip from description (filler verbs + prepositions)
const FILLER_RE = /\b(gastei|paguei|comprei|recebi|ganhei|caiu|entrou|recebeu|no|na|de|do|da|em|um|uma|por)\b/gi;

export function parseExpenseText(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: 'Digite um valor para registrar.' };
  }

  const extracted = extractAmount(trimmed);
  if (!extracted) {
    return {
      ok: false,
      error: 'Não encontrei um valor. Inclua o valor, ex: "Gastei 45,90 kr no Netto".',
    };
  }

  const { amount, rest } = extracted;
  const currency = detectCurrency(trimmed);
  const type = detectType(trimmed);
  const categoryName = guessCategory(trimmed);

  // Clean up description: remove currency tokens, type tokens, filler
  const description = rest
    .replace(BRL_TOKENS, '')
    .replace(DKK_TOKENS, '')
    .replace(FILLER_RE, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    ok: true,
    data: { amount, currency, type, categoryName, description },
  };
}
