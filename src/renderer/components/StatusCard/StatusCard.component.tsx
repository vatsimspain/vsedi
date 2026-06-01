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
    <div className="flex items-stretch overflow-hidden border bg-zinc-500/60 rounded-xl border-zinc-700/40">
      <div className={`w-2 flex-shrink-0 ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
      <div className="min-w-0 px-4 py-3.5">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-slate-200 text-sm font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}
