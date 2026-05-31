import type { StepProps } from '../../models/wizard.types';

export default function FinalStepView(_: StepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 py-8 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-900/50 border border-emerald-600/40">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
          <path
            d="M8 20l8 8 16-16"
            stroke="#34d399"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="max-w-sm">
        <h2 className="text-2xl font-semibold font-akira text-slate-100">
          ¡Todo listo!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          EuroScope ha sido configurado correctamente. Ya puedes cerrar este asistente y comenzar a controlar en VATSIM Spain.
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.electron.app.close()}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Cerrar
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M4 8h8M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
