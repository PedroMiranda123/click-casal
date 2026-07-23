import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================================
// CONTEÚDO EDITÁVEL
// ============================================================
const C = {
  inicio: '23 julho 2016',
  fim: '23 julho 2026',

  capa: {
    photo: '/wrapped/capa.jpg',
    sub: 'Tudo começou em um karaokê.\nHoje, dois continentes depois, aqui estão vocês. ♥',
  },

  comeco: {
    photo: '/wrapped/comeco.jpg',
    titulo: 'Era uma noite no Siga La Vaca',
    linhas: [
      'O Karaokê era na Santa Cecília.',
      'Pedro, 19 - Capão Redondo.',
      'Ana, 23 - Tatuapé',
      '',
      'O universo conspirou. E deu certo!',
    ],
  },

  numeros: {
    dias: '3.653', semanas: '521', meses: '120', horas: '87.672',
    sub: 'Não importa a unidade — é muito tempo. E ainda parece pouco.',
  },

  jornada: {
    eventos: [
      { data: 'Jul 2016', cor: '#C99A3B', texto: 'Um karaokê na Santa Cecília. Pedro, 19. Ana, 23. ', em: 'O começo de tudo.' },
      { data: 'Mai 2018', cor: '#C9613D', texto: 'Ana parte pro Qatar como comissária. Quilômetros de distância. Amor não vacila.' },
      { data: 'Mar 2020', cor: '#2E6FA3', texto: 'Ela volta 10 dias antes da pandemia fechar o mundo. O timing era perfeito.' },
      { data: 'Dez 2020', cor: '#8B6F9E', texto: 'Pedro compra um carro só pra buscar as malas no aeroporto. ', em: 'Isso é amor.' },
      { data: 'Jul 2021', cor: '#C99A3B', texto: 'No aniversário de 5 anos ela pergunta: "quer morar comigo?"', em: ' Sim.' },
      { data: 'Fev 2022', cor: '#C9613D', texto: 'Stella chega em casa. O apartamento nunca mais foi o mesmo.', em: ' Para melhor.' },
      { data: '2024',     cor: '#2E6FA3', texto: 'Primeira viagem internacional juntos. O Brasil ficou pequeno demais para os dois.' },
      { data: '2026',     cor: '#C99A3B', texto: 'Dois continentes, uma vida em comum. ', em: 'O próximo capítulo começa agora.' },
    ],
    fotos: ['/wrapped/jornada2.jpg', '/wrapped/jornada3.jpg'],
  },

  viagens: {
    paises: 6, cidades: 48,
    mapa: '/wrapped/mapa-mundi.png',
    fotos: ['/wrapped/viagens1.jpg', '/wrapped/viagens2.jpg', '/wrapped/viagens3.jpg', '/wrapped/viagens-4.jpg'],
    sub: 'E muitas mais estão por vir. 6 países foi só o aquecimento.',
  },

  honestos: [
    { valor: '~1.500', label: 'cafés da manhã',       obs: '(menos 1. você sabe qual)', cor: '#C99A3B' },
    { valor: '~700',   label: 'episódios assistidos', obs: '(ela dormiu em metade)',     cor: '#2E6FA3' },
    { valor: '~140',   label: 'domingos de limpeza',  obs: '(Pedro ainda resiste)',      cor: '#C9613D' },
    { valor: '∞',      label: 'risadas e abraços',    obs: '',                           cor: '#8B6F9E' },
  ],
  honestosPhotos: ['/wrapped/numeroshonestos1.jpg', '/wrapped/numeros3.jpg'],

  palavra: {
    pedro: { foto: '/wrapped/pedro.jpg', nome: 'Pedro', palavra: 'Engraçado',               cor: '#C99A3B' },
    ana:   { foto: '/wrapped/ana.jpg',   nome: 'Ana',   palavra: 'Perfeita, feita pelos deuses', cor: '#8B6F9E' },
    sub: 'Uma palavra era o combinado. Mas algumas pessoas merecem mais.',
  },

  stella: {
    titulo: 'A Stella merece seu próprio slide',
    stats: [
      { valor: '26/02/22', label: 'adotada. o apartamento nunca mais foi o mesmo.',  cor: '#C99A3B' },
      { valor: '1.608',    label: 'tapetes trocados desde que chegou',               cor: '#C9613D' },
      { valor: '150',      label: 'ataques de alergia na pele',                      cor: '#2E6FA3' },
      { valor: '1 sofá',   label: 'destruído. sem arrependimentos.',                 cor: '#C9613D' },
    ],
    fotos: ['/wrapped/stella1.jpg', '/wrapped/stella2.jpg', '/wrapped/stella4.jpg', '/wrapped/stella5.jpg'],
  },

  chameguinhos: {
    sub: 'Valor incalculável. A Stella concordaria se soubesse falar.',
    fotos: [
      '/wrapped/chameguinho1.jpg',
      '/wrapped/chameguinho2.jpg',
      '/wrapped/chameguinho3.jpg',
      '/wrapped/chameguinho4.jpg',
      '/wrapped/chameguinho5.jpg',
      '/wrapped/chameguinho6.jpg',
    ],
  },

  construimos: {
    cards: [
      { valor: '2 aptos',  label: 'morados juntos',         cor: '' },
      { valor: '3 carros', label: 'Fiesta, Civic, Lancer',  cor: '' },
      { valor: '2',        label: 'continentes habitados',  cor: '#C99A3B' },
      { valor: '1 Stella', label: 'sem preço',              cor: '#C9613D' },
    ],
    sub: 'Pedro teve 2 empregos. Ana teve 5. E o melhor ainda está acontecendo — juntos, em dois continentes.',
    fotos: ['/wrapped/construimos1.jpg', '/wrapped/construimos2.jpg', '/wrapped/construimos3.jpg'],
  },

  encerramento: {
    photo: '/wrapped/encerramento.jpg',
    titulo: 'Feliz aniversário ♥',
    sub: 'Aqui é só o começo.',
  },
};

const TOTAL = 11;

// ── Hook de reveal com delay escalonado ──────────────────────
function useReveal(count: number, delayMs = 260) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = Array.from({ length: count }, (_, i) =>
      setTimeout(() => setStep(i + 1), delayMs * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return step;
}

// ── Carousel com auto-rotate ─────────────────────────────────
function Carousel({ photos, ms, height = 220 }: { photos: string[]; ms: number; height?: number | string }) {
  const [idx, setIdx] = useState(0);
  const [anyLoaded, setAnyLoaded] = useState(false);

  useEffect(() => {
    if (photos.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % photos.length), ms);
    return () => clearInterval(id);
  }, [photos.length, ms]);

  return (
    <div className="relative w-full shrink-0 overflow-hidden" style={{ height: anyLoaded ? height : 0, transition: 'height 0.4s ease' }}>
      {photos.map((src, i) => (
        <img key={src} src={src} alt="" onLoad={() => setAnyLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: i === idx ? 1 : 0, transition: 'opacity 0.9s ease' }} />
      ))}
      {anyLoaded && photos.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
          {photos.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 14 : 4, height: 4, borderRadius: 2, background: i === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Foto hero no topo do slide ────────────────────────────────
function HeroPhoto({ src, height = 220 }: { src: string; height?: number | string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="relative w-full shrink-0 overflow-hidden" style={{ height: ok ? height : 0, transition: 'height 0.4s ease' }}>
      <img src={src} alt="" onLoad={() => setOk(true)} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(12,22,32,0.85) 100%)' }} />
    </div>
  );
}

// ── Foto circular com fallback ───────────────────────────────
function Portrait({ src, size = 72 }: { src: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (err) return <div className="rounded-full shrink-0" style={{ width: size, height: size, background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.14)' }} />;
  return <img src={src} alt="" onError={() => setErr(true)} className="rounded-full object-cover shrink-0" style={{ width: size, height: size, border: '2px solid rgba(255,255,255,0.22)' }} />;
}

// ── Constantes de estilo ─────────────────────────────────────
const LABEL: React.CSSProperties = {
  color: 'var(--gold)',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};
const WHITE = 'rgba(255,255,255,0.92)';
const DIM   = 'rgba(255,255,255,0.55)';
const FAINT = 'rgba(255,255,255,0.28)';
const GLASS: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' };
const SERIF = 'Fraunces, serif';
const SANS  = 'Plus Jakarta Sans, sans-serif';

// ── Animação de entrada (slide/fade) ─────────────────────────
function revealStyle(visible: boolean, axis: 'y' | 'x' = 'y', dist = 18): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : axis === 'y' ? `translateY(${dist}px)` : `translateX(-${dist}px)`,
    transition: 'opacity 0.42s ease, transform 0.42s ease',
  };
}

// ── Componente principal ─────────────────────────────────────
export default function WrappedPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const touchX = useRef(0);
  const busy = useRef(false);

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= TOTAL || busy.current) return;
    busy.current = true;
    setOpacity(0);
    setTimeout(() => { setCurrent(idx); setOpacity(1); busy.current = false; }, 220);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      else if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, navigate]);

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: '#0c1620' }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => { const dx = e.changedTouches[0].clientX - touchX.current; if (Math.abs(dx) > 50) dx < 0 ? next() : prev(); }}>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-50" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full" style={{ width: `${((current + 1) / TOTAL) * 100}%`, background: 'var(--gold)', transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>

      <button onClick={() => navigate('/')} aria-label="Voltar" className="absolute top-5 left-4 z-50 flex items-center gap-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: SANS }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        Voltar
      </button>

      <div className="absolute top-5 right-4 z-50 text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: SANS }}>
        {current + 1}&thinsp;/&thinsp;{TOTAL}
      </div>

      {/* Slide content */}
      <div className="absolute inset-0 flex flex-col" style={{ opacity, transition: 'opacity 0.22s ease', paddingTop: '48px', paddingBottom: '80px' }}>
        <SlideRenderer index={current} />
      </div>

      {/* Bottom nav */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 pb-8 pt-5" style={{ background: 'linear-gradient(to top, rgba(12,22,32,0.95) 0%, transparent 100%)' }}>
        <button onClick={prev} aria-label="Anterior" disabled={current === 0} className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90" style={{ background: current === 0 ? 'transparent' : 'rgba(255,255,255,0.07)', color: current === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.55)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} className="rounded-full transition-all duration-300" style={{ width: i === current ? 18 : 5, height: 5, background: i === current ? 'var(--gold)' : 'rgba(255,255,255,0.18)' }} />
          ))}
        </div>
        <button onClick={next} aria-label="Próximo" disabled={current === TOTAL - 1} className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90" style={{ background: current === TOTAL - 1 ? 'transparent' : 'rgba(255,255,255,0.07)', color: current === TOTAL - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.55)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
}

function SlideRenderer({ index }: { index: number }) {
  const slides = [S1Capa, S2Comeco, S3Numeros, S4Jornada, S5Viagens, S6Honestos, S7Palavra, S8Stella, S9Chameguinhos, S10Construimos, S11Encerramento];
  const Slide = slides[index];
  return Slide ? <Slide /> : null;
}

// ── S1: Capa ─────────────────────────────────────────────────
function S1Capa() {
  const [photoOk, setPhotoOk] = useState(false);
  return (
    <div className="relative flex-1 overflow-hidden">
      <img src={C.capa.photo} alt="" onLoad={() => setPhotoOk(true)} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: photoOk ? 1 : 0, transition: 'opacity 0.5s' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.76) 100%)', opacity: photoOk ? 1 : 0, transition: 'opacity 0.5s' }} />
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center px-6 pb-4 z-10" style={{ opacity: photoOk ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: photoOk ? 'auto' : 'none' }}>
        <div style={{ ...LABEL, background: 'rgba(201,154,59,0.2)', border: '1px solid rgba(201,154,59,0.4)', padding: '5px 14px', borderRadius: 20, marginBottom: 12 }}>
          {C.inicio} → {C.fim}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 700, color: WHITE, textShadow: '0 2px 12px rgba(0,0,0,0.5)', marginBottom: 10 }}>10 Anos de Pedro & Ana</div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.65, fontFamily: SANS, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
          {C.capa.sub.split('\n').map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 z-10" style={{ opacity: photoOk ? 0 : 1, transition: 'opacity 0.5s', pointerEvents: photoOk ? 'none' : 'auto' }}>
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,154,59,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontFamily: SERIF, fontSize: '100px', fontWeight: 600, color: 'var(--gold)', lineHeight: 1 }}>10</div>
        <div style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 300, color: WHITE, letterSpacing: '0.12em', marginTop: 4 }}>anos</div>
        <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.45, margin: '22px auto' }} />
        <div style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 600, color: WHITE }}>Pedro & Ana</div>
        <div style={{ color: FAINT, fontSize: '13px', marginTop: 6, fontFamily: SANS }}>{C.inicio} → {C.fim}</div>
      </div>
    </div>
  );
}

// ── S2: O começo ─────────────────────────────────────────────
function S2Comeco() {
  return (
    <div className="flex flex-col h-full">
      <HeroPhoto src={C.comeco.photo} height="clamp(150px, 30vh, 230px)" />
      <div className="flex flex-col px-6 pt-5 flex-1 overflow-y-auto">
        <div style={LABEL} className="mb-3">o começo</div>
        <div style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 600, color: WHITE, lineHeight: 1.2, marginBottom: 20 }}>
          {C.comeco.titulo}
        </div>
        <div className="rounded-2xl p-5" style={GLASS}>
          {C.comeco.linhas.map((linha, i) =>
            linha === ''
              ? <div key={i} style={{ height: '0.75em' }} />
              : <p key={i} style={{ color: DIM, fontSize: '15px', lineHeight: 1.75, fontFamily: SANS, margin: 0 }}>{linha}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── S3: Números — Spotify-style reveal ───────────────────────
function S3Numeros() {
  const step = useReveal(4, 350);

  const stats = [
    { n: C.numeros.dias,    l: 'dias juntos', icon: <IconCalendar /> },
    { n: C.numeros.semanas, l: 'semanas',     icon: <IconWeeks />   },
    { n: C.numeros.meses,   l: 'meses',       icon: <IconMonths />  },
    { n: C.numeros.horas,   l: 'horas',       icon: <IconClock />   },
  ];

  return (
    <div className="flex flex-col justify-center h-full px-6">
      <div style={{ ...LABEL, ...revealStyle(step >= 1) }} className="mb-6">10 anos em números</div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {stats.map((s, i) => (
          <div key={s.l} className="rounded-2xl p-4" style={{ ...GLASS, ...revealStyle(step > i) }}>
            <div style={{ color: 'var(--gold)', marginBottom: 10, opacity: 0.7 }}>{s.icon}</div>
            <div style={{ fontFamily: SERIF, fontSize: '34px', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{s.n}</div>
            <div style={{ color: DIM, fontSize: '11px', marginTop: 6, fontFamily: SANS, letterSpacing: '0.04em' }}>{s.l}</div>
          </div>
        ))}
      </div>
      <p style={{ color: DIM, fontSize: '13px', lineHeight: 1.7, fontFamily: SANS, fontStyle: 'italic', ...revealStyle(step >= 4) }}>
        {C.numeros.sub}
      </p>
    </div>
  );
}

// ── S4: A jornada — com reveal escalonado ────────────────────
function S4Jornada() {
  const n = C.jornada.eventos.length;
  const step = useReveal(n, 200);

  return (
    <div className="flex flex-col h-full">
      {/* Foto strip */}
      <div className="flex gap-1.5 mx-4 shrink-0 mb-1" style={{ height: 'clamp(64px, 12vh, 88px)' }}>
        {C.jornada.fotos.map(src => (
          <div key={src} className="flex-1 rounded-xl overflow-hidden">
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <div className="flex flex-col px-6 pt-2 flex-1 overflow-y-auto pb-2">
        <div style={LABEL} className="mb-3">a jornada</div>
        {C.jornada.eventos.map((ev, i) => (
          <div key={i} className="flex gap-3 items-start" style={revealStyle(step > i, 'x')}>
            <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
              <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ background: ev.cor, boxShadow: `0 0 6px ${ev.cor}66` }} />
              {i < n - 1 && <div style={{ width: 1, flex: 1, minHeight: 22, background: `linear-gradient(to bottom, ${ev.cor}44, transparent)`, margin: '4px 0' }} />}
            </div>
            <div className="pb-3">
              <div style={{ fontSize: '10px', color: ev.cor, fontWeight: 700, fontFamily: SANS, marginBottom: 2, letterSpacing: '0.08em' }}>{ev.data}</div>
              <div style={{ fontSize: '13px', color: DIM, lineHeight: 1.6, fontFamily: SANS }}>
                {ev.texto}
                {ev.em && <em style={{ color: WHITE, fontStyle: 'italic' }}>{ev.em}</em>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── S5: Viagens — mapa mundi + foto strip ────────────────────
function S5Viagens() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-2 shrink-0">
        <div style={LABEL} className="mb-2">o mundo de vocês</div>
        <div className="flex gap-2 mb-2">
          {[{ n: C.viagens.paises, l: 'países' }, { n: C.viagens.cidades, l: 'cidades' }].map(s => (
            <div key={s.l} className="rounded-xl px-3 py-1.5 flex items-center gap-2" style={GLASS}>
              <span style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 700, color: 'var(--blue)' }}>{s.n}</span>
              <span style={{ color: DIM, fontSize: '11px', fontFamily: SANS }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa */}
      <div className="relative mx-4 rounded-2xl overflow-hidden" style={{ height: 'clamp(180px, 44vh, 320px)', ...GLASS }}>
        <img src={C.viagens.mapa} alt="Mapa mundi" className="w-full h-full object-contain" />
      </div>

      {/* Foto strip viagens */}
      <div className="flex gap-1.5 mx-4 mt-2 shrink-0" style={{ height: 'clamp(52px, 10vh, 68px)' }}>
        {C.viagens.fotos.map(src => (
          <div key={src} className="flex-1 rounded-xl overflow-hidden">
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <p style={{ color: DIM, fontSize: '11.5px', padding: '8px 20px 0', fontFamily: SANS, fontStyle: 'italic' }}>
        {C.viagens.sub}
      </p>
    </div>
  );
}

// ── S6: Números honestos — foto maior + reveal ───────────────
function S6Honestos() {
  const step = useReveal(C.honestos.length, 260);

  return (
    <div className="flex flex-col h-full">
      <Carousel photos={C.honestosPhotos} ms={3200} height="clamp(160px, 28vh, 250px)" />
      <div className="flex flex-col px-6 pt-4 flex-1 overflow-y-auto">
        <div style={LABEL} className="mb-3">os números honestos</div>
        <div className="grid grid-cols-2 gap-3">
          {C.honestos.map((h, i) => (
            <div key={h.label} className="rounded-2xl p-4" style={{ ...GLASS, ...revealStyle(step > i) }}>
              <div style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: 700, color: h.cor, lineHeight: 1, marginBottom: 4 }}>{h.valor}</div>
              <div style={{ color: DIM, fontSize: '11.5px', fontFamily: SANS, lineHeight: 1.35, marginBottom: h.obs ? 4 : 0 }}>{h.label}</div>
              {h.obs && <div style={{ color: FAINT, fontSize: '9.5px', fontFamily: SANS }}>{h.obs}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── S7: Em uma palavra — efeito de suspense ──────────────────
function S7Palavra() {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const pessoas = [C.palavra.pedro, C.palavra.ana];

  return (
    <div className="flex flex-col justify-center h-full px-6">
      <div style={{ ...LABEL, ...revealStyle(revealed) }} className="mb-2">em uma palavra</div>
      <div style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 600, color: WHITE, marginBottom: 22, lineHeight: 1.2, ...revealStyle(revealed) }}>
        Como cada um descreve o outro
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {pessoas.map(p => (
          <div key={p.nome} className="rounded-2xl px-4 pt-5 pb-4 flex flex-col items-center text-center" style={GLASS}>
            <Portrait src={p.foto} size={76} />
            <div style={{ fontSize: '10px', color: FAINT, fontFamily: SANS, marginTop: 10, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              {p.nome}
            </div>

            {/* Suspense: pontos → palavra */}
            <div style={{ minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!revealed ? (
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="rounded-full" style={{
                      width: 6, height: 6,
                      background: 'rgba(255,255,255,0.3)',
                      animation: `bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
                    }} />
                  ))}
                </div>
              ) : (
                <div style={{
                  fontFamily: SERIF,
                  fontSize: p.palavra.length > 12 ? '13px' : '20px',
                  fontWeight: 700,
                  color: p.cor,
                  lineHeight: 1.25,
                  textAlign: 'center',
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? 'scale(1)' : 'scale(0.85)',
                  transition: 'opacity 0.55s ease, transform 0.55s ease',
                }}>
                  {p.palavra}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ width: 32, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto 14px', ...revealStyle(revealed) }} />
      <p style={{ color: DIM, fontSize: '13px', lineHeight: 1.7, fontFamily: SANS, fontStyle: 'italic', textAlign: 'center', ...revealStyle(revealed) }}>
        {C.palavra.sub}
      </p>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-5px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ── S8: Stella — reveal escalonado ───────────────────────────
function S8Stella() {
  const step = useReveal(C.stella.stats.length, 270);

  return (
    <div className="flex flex-col h-full">
      <Carousel photos={C.stella.fotos} ms={2500} height="clamp(140px, 26vh, 220px)" />
      <div className="flex flex-col px-6 pt-4 flex-1 overflow-y-auto">
        <div style={LABEL} className="mb-2">membro honorário</div>
        <div style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 600, color: WHITE, marginBottom: 16, lineHeight: 1.25 }}>
          {C.stella.titulo}
        </div>
        <div className="space-y-2">
          {C.stella.stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ ...GLASS, ...revealStyle(step > i, 'x') }}>
              <div className="shrink-0" style={{ fontFamily: SERIF, fontSize: '15px', fontWeight: 700, color: s.cor, minWidth: 62, textAlign: 'center', lineHeight: 1.1 }}>{s.valor}</div>
              <div style={{ color: DIM, fontSize: '12px', fontFamily: SANS, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── S9: Chameguinhos — galeria full-screen ───────────────────
function S9Chameguinhos() {
  const photos = C.chameguinhos.fotos;
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(new Array(photos.length).fill(false));

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % photos.length), 2200);
    return () => clearInterval(id);
  }, [photos.length]);

  const markLoaded = (i: number) => setLoaded(prev => { const n = [...prev]; n[i] = true; return n; });
  const anyLoaded = loaded.some(Boolean);

  return (
    <div className="relative flex-1 overflow-hidden">
      {photos.map((src, i) => (
        <img key={src} src={src} alt="" onLoad={() => markLoaded(i)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: i === idx ? 1 : 0, transition: 'opacity 1.1s ease' }} />
      ))}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(12,22,32,0.45) 0%, transparent 28%, transparent 52%, rgba(12,22,32,0.88) 100%)' }} />
      {!anyLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{ fontFamily: SERIF, fontSize: '80px', color: 'var(--plum)' }}>∞</div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center px-6 pb-3 z-10">
        <div style={LABEL} className="mb-2">arquivo secreto</div>
        <div style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 700, color: WHITE, marginBottom: 8, textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>
          chameguinhos
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.6, fontFamily: SANS, maxWidth: 260, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
          {C.chameguinhos.sub}
        </p>
      </div>
      {anyLoaded && (
        <div className="absolute bottom-[108px] left-0 right-0 flex justify-center gap-1.5 z-10">
          {photos.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 3, background: i === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── S10: O que construímos — reveal escalonado ───────────────
function S10Construimos() {
  const step = useReveal(C.construimos.cards.length, 240);

  return (
    <div className="flex flex-col h-full">
      <Carousel photos={C.construimos.fotos} ms={3000} height="clamp(140px, 26vh, 220px)" />
      <div className="flex flex-col px-6 pt-4 flex-1 overflow-y-auto">
        <div style={LABEL} className="mb-3">10 anos. 2 continentes.</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {C.construimos.cards.map((card, i) => (
            <div key={card.label} className="rounded-2xl p-4" style={{ ...GLASS, ...revealStyle(step > i) }}>
              <div style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 700, color: card.cor || WHITE, marginBottom: 4 }}>{card.valor}</div>
              <div style={{ color: DIM, fontSize: '11px', fontFamily: SANS, lineHeight: 1.35 }}>{card.label}</div>
            </div>
          ))}
        </div>
        <p style={{ color: DIM, fontSize: '13px', lineHeight: 1.7, fontFamily: SANS, fontStyle: 'italic', ...revealStyle(step >= 4) }}>
          {C.construimos.sub}
        </p>
      </div>
    </div>
  );
}

// ── S11: Encerramento — texto no topo ────────────────────────
function S11Encerramento() {
  const [photoOk, setPhotoOk] = useState(false);
  return (
    <div className="relative flex-1 overflow-hidden">
      <img src={C.encerramento.photo} alt="" onLoad={() => setPhotoOk(true)} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: photoOk ? 1 : 0, transition: 'opacity 0.5s' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.1) 100%)', opacity: photoOk ? 1 : 0, transition: 'opacity 0.5s' }} />
      <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at center 35%, rgba(201,154,59,0.12) 0%, transparent 65%)' }} />

      <div className="absolute top-0 left-0 right-0 flex flex-col items-center text-center px-6 pt-6 z-10">
        <div style={{ fontSize: '44px', color: 'var(--gold)', lineHeight: 1, marginBottom: 14, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>♥</div>
        <div style={{ ...LABEL, background: 'rgba(201,154,59,0.22)', border: '1px solid rgba(201,154,59,0.45)', padding: '5px 14px', borderRadius: 20, marginBottom: 14 }}>
          {C.fim}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: '30px', fontWeight: 700, color: WHITE, textShadow: '0 2px 16px rgba(0,0,0,0.6)', marginBottom: 10, lineHeight: 1.2 }}>
          {C.encerramento.titulo}
        </div>
        <div style={{ width: 32, height: 1, background: 'rgba(201,154,59,0.5)', margin: '0 auto 12px' }} />
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', fontFamily: SANS, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
          {C.encerramento.sub}
        </div>
      </div>
    </div>
  );
}

// ── Ícones para S3 ───────────────────────────────────────────
function IconCalendar() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function IconWeeks() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>;
}
function IconMonths() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>;
}
function IconClock() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
