export default function StatusCard({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-3 bg-zinc-500/60 rounded-xl px-4 py-3.5 border border-zinc-700/40">
      <span
        className={[
          'w-2 h-2 rounded-full flex-shrink-0',
          ok ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-400 shadow-sm shadow-red-400/50',
        ].join(' ')}
      />
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-slate-200 text-sm font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}
