import { useEffect } from 'react';
import { useInstallation } from '../../hooks/useInstallation.hook';
import type { StepProps } from '../../models/wizard.types';

const TASKS = [
  { label: 'Obteniendo información del release', stage: 'fetching' },
  { label: 'Descargando archivos', stage: 'downloading' },
  { label: 'Instalando en EuroScope', stage: 'extracting' },
] as const;

type Stage = (typeof TASKS)[number]['stage'] | 'done' | 'error' | 'idle';

function stageIndex(stage: Stage): number {
  if (stage === 'fetching') return 0;
  if (stage === 'downloading') return 1;
  if (stage === 'extracting') return 2;
  return 3;
}

function overallProgress(stage: Stage, dlPercent: number): number {
  if (stage === 'idle') return 0;
  if (stage === 'fetching') return 3;
  if (stage === 'downloading') return 5 + dlPercent * 0.85;
  if (stage === 'extracting') return 92;
  if (stage === 'done') return 100;
  return 0;
}

export default function ProgressStepView({ formData, onBack }: StepProps) {
  const { status, progress, error, install } = useInstallation();
  const done = status === 'done';
  const hasError = status === 'error';

  useEffect(() => {
    install({
      overwriteSettings: formData.overwriteSettings,
      destFolder: formData.sectorsFolder,
      name: formData.name,
      cid: formData.cid,
      password: formData.password,
      rank: formData.rank,
      hoppieCode: formData.hoppieCode,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedCount = done ? TASKS.length : stageIndex(status as Stage);
  const totalProgress = overallProgress(status as Stage, progress);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold font-akira text-slate-100">
          {done
            ? '¡Listo para controlar!'
            : hasError
              ? 'Error durante la instalación'
              : 'Configurando tu EuroScope...'}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {done
            ? 'Euroscope se ha configurado correctamente. Ya puedes empezar a controlar.'
            : hasError
              ? 'Ha ocurrido un error. Revisa los datos e inténtalo de nuevo.'
              : 'Por favor espera mientras configuramos el sistema.'}
        </p>
      </div>

      {hasError ? (
        <div className="px-4 py-3 text-sm text-red-400 border rounded-lg border-red-800/60 bg-red-950/30">
          {error}
        </div>
      ) : (
        <>
          <div>
            <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-300 rounded-full transition-[width] duration-150"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500">Progreso</span>
              <span className="text-xs font-medium text-slate-400 tabular-nums">
                {Math.round(totalProgress)}%
              </span>
            </div>
          </div>

          <ul className="flex flex-col gap-2.5">
            {TASKS.map((task, i) => {
              const isComplete = i < completedCount;
              const isActive = !isComplete && i === completedCount && !done;
              const isPending = !isComplete && !isActive;

              return (
                <li
                  key={task.stage}
                  className={[
                    'flex items-center gap-3 text-sm transition-opacity duration-300',
                    isPending ? 'opacity-30' : 'opacity-100',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-center flex-shrink-0 w-5 h-5">
                    {isComplete ? (
                      <span className="flex items-center justify-center w-5 h-5 border rounded-full bg-emerald-900/60 border-emerald-600/50">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M1.5 5l2.5 2.5 4.5-4.5"
                            stroke="#34d399"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    ) : isActive ? (
                      <div className="w-4 h-4 border-2 rounded-full border-slate-600 border-t-zinc-300 animate-spin" />
                    ) : (
                      <span className="block w-2 h-2 mx-auto rounded-full bg-zinc-500" />
                    )}
                  </span>
                  <span
                    className={
                      isComplete
                        ? 'text-emerald-400'
                        : isActive
                          ? 'text-slate-200'
                          : 'text-slate-500'
                    }
                  >
                    {task.label}
                    {isActive &&
                      task.stage === 'downloading' &&
                      progress > 0 && (
                        <span className="ml-2 text-slate-500 tabular-nums">
                          {progress}%
                        </span>
                      )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {(done || hasError) && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
          >
            Atrás
          </button>
          {done && (
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Finalizar
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 8l5 5 7-7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
