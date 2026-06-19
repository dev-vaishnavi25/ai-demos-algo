import { LIBRARIES, type LibKey } from '@/lib/libraries';

/** A small colored badge naming one of the three libraries. */
export function Chip({ lib }: { lib: LibKey }) {
  const meta = LIBRARIES[lib];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.border} ${meta.bg} ${meta.text}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.name}
    </span>
  );
}
