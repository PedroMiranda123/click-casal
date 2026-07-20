import { Link } from 'react-router-dom';

interface PageShellProps {
  title: string;
  backTo?: string;          // undefined = no back button (Hub)
  rightSlot?: React.ReactNode; // e.g. SettingsMenu, "Interesses →" button
  children: React.ReactNode;
  fab?: React.ReactNode;    // fixed FAB button if needed
}

export function PageShell({ title, backTo, rightSlot, children, fab }: PageShellProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        {backTo && (
          <Link
            to={backTo}
            className="text-sm font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all active:scale-95"
            style={{ color: 'var(--ink-dim)', background: 'rgba(27,42,56,0.07)' }}
          >
            ← Início
          </Link>
        )}
        <h1
          className="flex-1 text-xl font-semibold"
          style={{ fontFamily: 'Fraunces, serif', color: 'var(--ink)' }}
        >
          {title}
        </h1>
        {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      </header>

      <main className="flex-1 pb-24">
        {children}
      </main>

      {fab}
    </div>
  );
}
