import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../api';

interface Catalog {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerColor: string;
  label: string;
  runFrom: string;
  runTill: string;
  pageCount: number;
  offerCount: number;
  coverThumb: string | null;
  coverView: string | null;
}

interface Page {
  thumb: string;
  view: string;
  zoom: string;
}

export default function FolhetosPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ catalog: Catalog; pages: Page[] } | null>(null);
  const [viewerPage, setViewerPage] = useState(0);
  const [pagesLoading, setPagesLoading] = useState(false);

  useEffect(() => {
    apiJson<Catalog[]>('/flyers/catalogs')
      .then(setCatalogs)
      .catch(() => setError('Não foi possível carregar os folhetos.'))
      .finally(() => setLoading(false));
  }, []);

  async function openFlyer(catalog: Catalog) {
    setPagesLoading(true);
    setViewerPage(0);
    try {
      const pages = await apiJson<Page[]>(`/flyers/catalogs/${catalog.id}/pages`);
      setViewer({ catalog, pages });
    } catch {
      // fallback: show cover only
      setViewer({ catalog, pages: catalog.coverView ? [{ thumb: catalog.coverView, view: catalog.coverView, zoom: catalog.coverView }] : [] });
    } finally {
      setPagesLoading(false);
    }
  }

  function closeViewer() { setViewer(null); setViewerPage(0); }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link
          to="/"
          className="text-sm font-medium px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ color: 'var(--ink-muted)', background: 'rgba(0,0,0,0.06)' }}
        >
          ← Início
        </Link>
        <h1 className="text-xl font-semibold flex-1" style={{ color: 'var(--ink)' }}>Folhetos</h1>
        <Link to="/ofertas" className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ color: 'var(--gold)', background: 'var(--gold-bg)' }}>
          Ofertas →
        </Link>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--coral)' }}>{error}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {catalogs.map(cat => (
              <button
                key={cat.id}
                onClick={() => openFlyer(cat)}
                className="rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97]"
                style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-border)' }}
              >
                {cat.coverThumb ? (
                  <img
                    src={cat.coverThumb}
                    alt={`${cat.dealerName} ${cat.label}`}
                    className="w-full h-36 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center text-3xl font-bold"
                    style={{ background: cat.dealerColor + '22', color: cat.dealerColor }}>
                    {cat.dealerName[0]}
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: cat.dealerColor }}
                    />
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--ink)' }}>{cat.dealerName}</p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{cat.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                    {cat.offerCount} ofertas · {cat.pageCount} pág.
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen flyer viewer */}
      {(viewer || pagesLoading) && (
        <FlyerViewer
          catalog={viewer?.catalog ?? null}
          pages={viewer?.pages ?? []}
          loading={pagesLoading}
          currentPage={viewerPage}
          onPageChange={setViewerPage}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}

function FlyerViewer({
  catalog,
  pages,
  loading,
  currentPage,
  onPageChange,
  onClose,
}: {
  catalog: Catalog | null;
  pages: Page[];
  loading: boolean;
  currentPage: number;
  onPageChange: (n: number) => void;
  onClose: () => void;
}) {
  const imgRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onPageChange(Math.min(currentPage + 1, pages.length - 1));
      if (e.key === 'ArrowLeft') onPageChange(Math.max(currentPage - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentPage, pages.length, onClose, onPageChange]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) onPageChange(Math.min(currentPage + 1, pages.length - 1));
    if (dx > 50) onPageChange(Math.max(currentPage - 1, 0));
    touchStartX.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(10,10,15,0.97)' }}
    >
      {/* Viewer header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full text-white"
          style={{ background: 'rgba(255,255,255,0.12)' }}
          aria-label="Fechar"
        >
          ✕
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {catalog?.dealerName} — {catalog?.label}
          </p>
          {!loading && pages.length > 0 && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {currentPage + 1} / {pages.length}
            </p>
          )}
        </div>
      </div>

      {/* Page image */}
      <div
        ref={imgRef}
        className="flex-1 flex items-center justify-center overflow-hidden px-4"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
          <div className="w-16 h-16 rounded-full border-4 border-white border-r-transparent animate-spin" />
        ) : pages.length === 0 ? (
          <p className="text-white opacity-50">Sem páginas disponíveis</p>
        ) : (
          <img
            key={currentPage}
            src={pages[currentPage]?.view}
            alt={`Página ${currentPage + 1}`}
            className="max-h-full max-w-full object-contain rounded-xl"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
          />
        )}
      </div>

      {/* Navigation */}
      {!loading && pages.length > 1 && (
        <div className="flex items-center justify-between px-4 pb-10 pt-4 flex-shrink-0">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
            disabled={currentPage === 0}
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
            aria-label="Página anterior"
          >‹</button>

          {/* Page dots — show max 7 around current */}
          <div className="flex gap-1.5 items-center overflow-hidden max-w-[200px]">
            {pages.slice(
              Math.max(0, currentPage - 3),
              Math.min(pages.length, currentPage + 4)
            ).map((_, relI) => {
              const absI = Math.max(0, currentPage - 3) + relI;
              return (
                <button
                  key={absI}
                  onClick={() => onPageChange(absI)}
                  className="rounded-full flex-shrink-0 transition-all"
                  style={{
                    width: absI === currentPage ? 20 : 6,
                    height: 6,
                    background: absI === currentPage ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}
                  aria-label={`Página ${absI + 1}`}
                />
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, pages.length - 1))}
            disabled={currentPage === pages.length - 1}
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
            aria-label="Próxima página"
          >›</button>
        </div>
      )}
    </div>
  );
}
