interface Props {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className = '', lines = 3 }: Props) {
  return (
    <div className={`flat-panel rounded-2xl p-4 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton rounded-lg h-4 mb-3 last:mb-0 ${i === 0 ? 'w-1/2' : i === lines - 1 ? 'w-1/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
