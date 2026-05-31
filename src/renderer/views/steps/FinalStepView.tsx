import { useEffect, useState } from 'react';
import { CloseIcon } from '../../icons/Close.icon';
import { HappyFaceIcon } from '../../icons/HappyFace.icon';
import type { StepProps } from '../../models/wizard.types';

export default function FinalStepView(_: StepProps) {
  const [euroscopeExists, setEuroscopeExists] = useState(false);

  useEffect(() => {
    window.electron.euroscope.exists().then(setEuroscopeExists);
  }, []);

  const launchAndClose = () => {
    window.electron.euroscope.launch();
    window.electron.app.close();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 py-8 text-center">
      <div className="flex items-center justify-center w-20 h-20 border rounded-full bg-emerald-900/50 border-emerald-600/40">
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
          EuroScope ha sido configurado correctamente. Ya puedes cerrar este
          asistente y comenzar a controlar en VATSIM Spain.
        </p>
      </div>
      <div className="flex flex-row gap-2">
        {euroscopeExists && (
          <button
            type="button"
            onClick={() => launchAndClose()}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-500 active:bg-orange-700"
          >
            Ejecutar EuroScope
            <HappyFaceIcon />
          </button>
        )}
        <button
          type="button"
          onClick={() => window.electron.app.close()}
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700"
        >
          Cerrar
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
