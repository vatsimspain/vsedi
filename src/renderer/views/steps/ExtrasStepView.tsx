import { EXTRAS } from '../../../const/extras.config';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';
import { CheckMarkIcon } from '../../icons/CheckMark.icon';
import type { StepProps } from '../../models/wizard.types';

export default function ExtrasStepView({
  formData,
  setFormData,
  onNext,
  onBack,
}: StepProps) {
  const selected = formData.extras;

  const toggle = (id: string) => {
    setFormData({
      extras: selected.includes(id)
        ? selected.filter((e) => e !== id)
        : [...selected, id],
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold font-akira text-slate-100">
          Extras
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Selecciona las herramientas adicionales que quieras instalar junto con
          los sectores. Puedes omitir este paso si no necesitas ninguna.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {EXTRAS.map((extra) => {
          const isSelected = selected.includes(extra.id);
          return (
            <button
              key={extra.id}
              type="button"
              onClick={() => toggle(extra.id)}
              className={[
                'flex items-center gap-4 w-full text-left px-4 py-4 rounded-xl border transition-all',
                isSelected
                  ? 'bg-zinc-700/60 border-zinc-500 ring-1 ring-zinc-500/30'
                  : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800',
              ].join(' ')}
            >
              <span
                className={[
                  'flex items-center justify-center w-5 h-5 rounded border flex-shrink-0 transition-all',
                  isSelected
                    ? 'bg-emerald-600 border-emerald-500'
                    : 'border-zinc-500 bg-zinc-700',
                ].join(' ')}
              >
                {isSelected && <CheckMarkIcon className="text-white" />}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-100">
                    {extra.name}
                  </span>
                  {extra.version && (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-zinc-700 text-zinc-400 font-mono">
                      {extra.version}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                  {extra.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ArrowRightIcon className="rotate-180" />
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {selected.length > 0
            ? `Instalar ${selected.length === 1 ? '1 extra' : `${selected.length} extras`}`
            : 'Continuar sin extras'}
          <ArrowRightIcon/>
        </button>
      </div>
    </div>
  );
}
