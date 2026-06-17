export default function StatusCard({
  label,
  value,
  status = 'ok',
}: {
  label: string;
  value: string;
  status?: 'ok' | 'warn' | 'error';
}) {
  const accent =
    status === 'ok'
      ? 'bg-emerald-400'
      : status === 'warn'
        ? 'bg-amber-400'
        : 'bg-red-400';

  return (
    <div className="flex items-stretch overflow-hidden border bg-zinc-500/60 rounded-xl border-zinc-700/40">
      <div className={`w-2 flex-shrink-0 ${accent}`} />
      <div className="min-w-0 px-4 py-3.5">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-slate-200 text-sm font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}
