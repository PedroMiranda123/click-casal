import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../api';

interface Offer {
  id: string;
  name: string;
  description: string | null;
  priceOre: number;
  prePriceOre: number | null;
  validFrom: string;
  validUntil: string;
  imageUrl: string | null;
  dealerName: string;
  dealerColor: string;
}

const STORES = [
  { dealerId: '9ba51',  name: 'Netto' },
  { dealerId: '11deC',  name: 'REMA 1000' },
  { dealerId: 'DWZE1w', name: '365discount' },
  { dealerId: '267e1m', name: 'MENY' },
  { dealerId: 'bdf5A',  name: 'Føtex' },
  { dealerId: 'eQeo00', name: 'Coop' },
];

function formatPrice(ore: number) {
  return (ore / 100).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';
}

export default function OfertasPage() {
  const [activeStore, setActiveStore] = useState(STORES[0]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setOffers([]);
    apiJson<Offer[]>(`/flyers/offers?dealer_id=${activeStore.dealerId}`)
      .then(data => { if (!cancelled) setOffers(data); })
      .catch(() => { if (!cancelled) setError('Não foi possível carregar as ofertas.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeStore]);

  const filtered = search.trim()
    ? offers.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    : offers;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center gap-3">
        <Link
          to="/"
          className="text-sm font-medium px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ color: 'var(--ink-muted)', background: 'rgba(0,0,0,0.06)' }}
        >
          ← Início
        </Link>
        <h1 className="text-xl font-semibold flex-1 truncate" style={{ color: 'var(--ink)' }}>Ofertas</h1>
        <Link to="/folhetos" className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ color: 'var(--gold)', background: 'var(--gold-bg)' }}>
          Folhetos →
        </Link>
      </div>

      {/* Store tabs */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
        {STORES.map(store => (
          <button
            key={store.dealerId}
            onClick={() => { setActiveStore(store); setSearch(''); }}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeStore.dealerId === store.dealerId ? 'var(--ink)' : 'rgba(0,0,0,0.06)',
              color: activeStore.dealerId === store.dealerId ? 'var(--bg)' : 'var(--ink)',
            }}
          >
            {store.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-5 pb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar ofertas…"
          className="w-full rounded-xl px-4 py-2.5 outline-none text-sm"
          style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)', border: '1px solid rgba(0,0,0,0.08)', fontSize: 16 }}
        />
      </div>

      {/* Content */}
      <div className="px-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--coral)' }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--ink-faint)' }}>Nenhuma oferta encontrada.</p>
        ) : (
          <>
            <p className="text-xs mb-3" style={{ color: 'var(--ink-faint)' }}>
              {filtered.length} oferta{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(offer => (
                <div
                  key={offer.id}
                  className="rounded-2xl p-3 flex flex-col gap-1"
                  style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-border)' }}
                >
                  {offer.imageUrl && (
                    <img
                      src={offer.imageUrl}
                      alt={offer.name}
                      className="w-full h-20 object-contain rounded-xl mb-1"
                      style={{ background: 'rgba(0,0,0,0.04)' }}
                      loading="lazy"
                    />
                  )}
                  <p className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: 'var(--ink)' }}>
                    {offer.name}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-auto pt-1">
                    {offer.prePriceOre != null && (
                      <span className="text-xs line-through" style={{ color: 'var(--ink-faint)' }}>
                        {formatPrice(offer.prePriceOre)}
                      </span>
                    )}
                    <span className="text-sm font-bold" style={{ color: offer.prePriceOre != null ? 'var(--coral)' : 'var(--ink)' }}>
                      {formatPrice(offer.priceOre)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                    até {new Date(offer.validUntil).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
