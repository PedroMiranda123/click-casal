interface Props {
  message: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorCard({ message, onRetry, className = '' }: Props) {
  return (
    <div className={`flat-panel rounded-2xl p-4 flex items-center justify-between gap-3 ${className}`}>
      <p className="text-sm" style={{ color: 'var(--coral)' }}>{message}</p>
      <button
        onClick={onRetry}
        className="text-sm font-semibold whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors"
        style={{ background: 'var(--coral-bg)', color: 'var(--coral)' }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
