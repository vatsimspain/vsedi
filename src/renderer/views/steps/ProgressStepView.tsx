import { useEffect, useMemo } from 'react';
import { useInstallation } from '../../hooks/useInstallation.hook';
import type { StepProps } from '../../models/wizard.types';
import { EXTRAS } from '../../../const/extras.config';
import { TickIcon } from '../../icons/TickIcon.icon';
import { CheckMarkIcon } from '../../icons/CheckMark.icon';
import { CloseIcon } from '../../icons/Close.icon';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';

const BACKUP_TASK = {
  label: 'Haciendo backup y limpiando sectores antiguos',
  stage: 'backup',
} as const;

const BASE_TASKS = [
  { label: 'Obteniendo información del release', stage: 'fetching' },
  { label: 'Descargando archivos', stage: 'downloading' },
  { label: 'Instalando en EuroScope', stage: 'extracting' },
] as const;

function overallProgress(
  stage: string,
  dlPercent: number,
  doneExtras: number,
  totalExtras: number,
  hasBackup: boolean,
): number {
  if (stage === 'idle') return 0;
  if (stage === 'fetching') return 3;
  if (hasBackup) {
    if (stage === 'downloading') return 5 + dlPercent * 0.6;
    if (stage === 'backup') return 70;
    if (stage === 'extracting') return 85;
  } else {
    if (stage === 'downloading') return 5 + dlPercent * 0.8;
    if (stage === 'extracting') return 87;
  }
  if (stage === 'extras') {
    const extraShare = totalExtras > 0 ? (doneExtras / totalExtras) * 10 : 0;
    return 90 + extraShare;
  }
  if (stage === 'done') return 100;
  return 0;
}

export default function ProgressStepView({
  formData,
  onBack,
  onNext,
}: StepProps) {
  const { status, progress, error, install, extrasProgress } =
    useInstallation();
  const done = status === 'done';
  const hasError = status === 'error';

  const selectedExtras = EXTRAS.filter((e) => formData.extras.includes(e.id));
  const hasBackup = formData.backupAndCleanSectors;

  const tasks = useMemo(() => {
    if (!hasBackup) return BASE_TASKS;
    return [BASE_TASKS[0], BASE_TASKS[1], BACKUP_TASK, BASE_TASKS[2]];
  }, [hasBackup]);

  useEffect(() => {
    install({
      overwriteSettings: formData.overwriteSettings,
      backupAndCleanSectors: formData.backupAndCleanSectors,
      destFolder: formData.sectorsFolder,
      name: formData.name,
      cid: formData.cid,
      password: formData.password,
      rank: formData.rank,
      hoppieCode: formData.hoppieCode,
      fontSize: formData.fontSize,
      extras: formData.extras,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneExtras = Object.values(extrasProgress).filter(
    (s) => s === 'done' || s === 'error',
  ).length;
  const totalProgress = overallProgress(
    status,
    progress,
    doneExtras,
    selectedExtras.length,
    hasBackup,
  );

  const stageIndex = tasks.findIndex((t) => t.stage === status);
  const baseCompletedCount =
    status === 'done' || status === 'extras'
      ? tasks.length
      : Math.max(stageIndex, 0);

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
            {tasks.map((task, i) => {
              const isComplete = i < baseCompletedCount;
              const isActive =
                !isComplete &&
                i === baseCompletedCount &&
                status !== 'done' &&
                status !== 'extras';
              const isPending = !isComplete && !isActive;

              return (
                <li
                  key={task.stage}
                  className={[
                    'flex items-center gap-3 text-sm transition-opacity duration-300',
                    isPending ? 'opacity-30' : 'opacity-100',
                  ].join(' ')}
                >
                  <TaskIcon isComplete={isComplete} isActive={isActive} />
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

            {selectedExtras.map((extra) => {
              const extraStatus = extrasProgress[extra.id];
              const isComplete = extraStatus === 'done';
              const isError = extraStatus === 'error';
              const isActive = extraStatus === 'running';
              const isPending =
                !extraStatus && status === 'extras'
                  ? false
                  : !isComplete && !isActive && !isError;
              const needsUserInteraction = isActive && extra.source !== 'font';

              return (
                <li
                  key={extra.id}
                  className={[
                    'flex items-start gap-3 text-sm transition-opacity duration-300',
                    isPending ? 'opacity-30' : 'opacity-100',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-center flex-shrink-0 w-5 h-5 mt-0.5">
                    {isComplete ? (
                      <span className="flex items-center justify-center w-5 h-5 border rounded-full bg-emerald-900/60 border-emerald-600/50">
                        <CheckMarkIcon className="text-emerald-400" />
                      </span>
                    ) : isError ? (
                      <span className="flex items-center justify-center w-5 h-5 border rounded-full bg-red-900/60 border-red-600/50">
                        <CloseIcon className="w-2.5 h-2.5 text-red-400" />
                      </span>
                    ) : isActive ? (
                      <div className="w-4 h-4 border-2 rounded-full border-slate-600 border-t-zinc-300 animate-spin" />
                    ) : (
                      <span className="block w-2 h-2 mx-auto rounded-full bg-zinc-500" />
                    )}
                  </span>

                  <div>
                    <span
                      className={
                        isComplete
                          ? 'text-emerald-400'
                          : isError
                            ? 'text-red-400'
                            : isActive
                              ? 'text-slate-200'
                              : 'text-slate-500'
                      }
                    >
                      {extra.name}
                    </span>
                    {needsUserInteraction && (
                      <p className="mt-0.5 text-xs text-amber-400/80">
                        El instalador se ha abierto. Configúralo y ciérralo para
                        continuar.
                      </p>
                    )}
                    {isError && (
                      <p className="mt-0.5 text-xs text-red-400/70">
                        No se pudo instalar. Puedes hacerlo manualmente después.
                      </p>
                    )}
                  </div>
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
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 rotate-180" />
            Atrás
          </button>
          {done && (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Finalizar
              <TickIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TaskIcon({
  isComplete,
  isActive,
}: {
  isComplete: boolean;
  isActive: boolean;
}) {
  return (
    <span className="flex items-center justify-center flex-shrink-0 w-5 h-5">
      {isComplete ? (
        <span className="flex items-center justify-center w-5 h-5 border rounded-full bg-emerald-900/60 border-emerald-600/50">
          <CheckMarkIcon className="text-emerald-400" />
        </span>
      ) : isActive ? (
        <div className="w-4 h-4 border-2 rounded-full border-slate-600 border-t-zinc-300 animate-spin" />
      ) : (
        <span className="block w-2 h-2 mx-auto rounded-full bg-zinc-500" />
      )}
    </span>
  );
}
