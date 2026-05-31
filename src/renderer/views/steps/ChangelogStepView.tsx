import { ArrowRightIcon } from '../../icons/ArrowRight.icon';
import type { StepProps } from '../../models/wizard.types';

const MOCK_CHANGELOG = `
LEXX
- Reajustado el formato de todos los ATIS.
- Añadidas “airport conditions” específicas a ATIS que las usan en la realidad. Aparecerán en azul en la casilla “Airport Conditions”, pueden activarse y desactivarse pulsando sobre el texto gris “Airport Conditions” encima de la caja.
- Añadido QFE en el ATIS en las estaciones que lo proveen en la realidad.
- Actualizado ground layout plugin a la última versión.
- Actualizado el plugin CDM a la última versión.

GCCC
- Sin cambios.

LECB
- Cambios en los stand de LEDA (coordenadas e incompatibilidades).
- Actualizado el sector de LEPA para coincidir con el real.
- Corregidos los sector limits de los sectores de ruta.
- Creada nueva posición de ruta (LECB_CVN_CTR) para más información puedes visitar la [biblioteca](https://biblioteca.vatsimspain.es/books/fir-barcelona-lecb/page/barcelona-control-bloque-este-ruta-5).

LECM
- Actualizada representación radar de LESO para asemejarse más al real.
- Actualizada representación radar de LEAM para asemejarse más al real.
- Actualizada representación radar de LEAS para asemejarse más al real.


¡Feliz y próspero AIRAC 2605!

`;

export default function ChangelogStepView({ onNext, onBack }: StepProps) {
  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h1 className="text-2xl font-semibold leading-tight font-akira text-slate-100">
          Novedades
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Esto es lo que el equipo de Operaciones te tiene preparado para este AIRAC. ¡Esperamos que te guste!
        </p>
      </div>

      <textarea
        readOnly
        value={MOCK_CHANGELOG}
        className="flex-1 min-h-64 w-full resize-none rounded-xl bg-zinc-900/70 border border-slate-700/40 px-4 py-3.5 text-sm text-slate-300 leading-relaxed font-mono focus:outline-none"
      />

      <div className="flex justify-between gap-2 pt-1">
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
          Continuar
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
