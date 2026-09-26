import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInstallation } from '../../hooks/useInstallation.hook';
import type { StepProps } from '../../models/wizard.types';
import { EXTRAS } from '../../../const/extras.config';
import EuroscopeLogo from '../../../../assets/logo/euroscope.png';
import { TickIcon } from '../../icons/TickIcon.icon';
import { CheckMarkIcon } from '../../icons/CheckMark.icon';
import { CloseIcon } from '../../icons/Close.icon';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';
import { RefreshIcon } from '../../icons/Refresh.icon';

type TaskStage = 'fetching' | 'downloading' | 'backup' | 'extracting';
type Task = { stage: TaskStage };

const BACKUP_TASK: Task = { stage: 'backup' };
const BASE_TASKS: Task[] = [
  { stage: 'fetching' },
  { stage: 'downloading' },
  { stage: 'extracting' },
];

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

let installStartedThisSession = false;

export default function ProgressStepView({
  formData,
  onBack,
  onNext,
}: StepProps) {
  const { t } = useTranslation();
  const { status, progress, error, install, extrasProgress } =
    useInstallation();
  const done = status === 'done';
  const hasError = status === 'error';
  const [euroscopeBlocked, setEuroscopeBlocked] = useState(false);
  const [repeatConfirm, setRepeatConfirm] = useState(installStartedThisSession);

  const selectedExtras = EXTRAS.filter((e) => formData.extras.includes(e.id));
  const hasBackup = formData.backupAndCleanSectors;

  const tasks = useMemo(() => {
    if (!hasBackup) return BASE_TASKS;
    return [BASE_TASKS[0], BASE_TASKS[1], BACKUP_TASK, BASE_TASKS[2]];
  }, [hasBackup]);

  const startInstall = useCallback(() => {
    installStartedThisSession = true;
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
      betaPassword: formData.betaPassword,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guards against starting the install (or updating state) from a check
  // that was still in flight when the user navigated away from this step.
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  // Writing sector files while EuroScope has them open can fail or corrupt
  // them, so check first and only start the install once it's closed.
  const checkEuroscopeAndInstall = useCallback(async () => {
    const running = await window.electron.euroscope.isRunning();
    if (!mountedRef.current) return running;
    setEuroscopeBlocked(running);
    if (!running) startInstall();
    return running;
  }, [startInstall]);

  useEffect(() => {
    if (installStartedThisSession) return undefined;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const running = await checkEuroscopeAndInstall();
      if (!running) return;
      // Keep re-checking in the background so the install starts on its own
      // as soon as the user closes EuroScope, without needing a manual retry.
      pollTimer = setInterval(async () => {
        const stillRunning = await checkEuroscopeAndInstall();
        if (!stillRunning && pollTimer) clearInterval(pollTimer);
      }, 2000);
    })();

    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReinstall = () => {
    setRepeatConfirm(false);
    checkEuroscopeAndInstall();
  };

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

  if (repeatConfirm && status === 'idle') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold font-akira text-slate-100">
            {t('progress.repeat_title')}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {t('progress.repeat_message')}
          </p>
        </div>
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 rotate-180" />
            {t('nav.back')}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReinstall}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshIcon className="w-4 h-4" />
              {t('progress.repeat_reinstall')}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t('nav.continue')}
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold font-akira text-slate-100">
          {done
            ? t('progress.title_ready')
            : hasError
              ? t('progress.title_error')
              : euroscopeBlocked
                ? t('progress.euroscope_running_title')
                : t('progress.title_progress')}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {done
            ? t('progress.subtitle_ready')
            : hasError
              ? t('progress.subtitle_error')
              : euroscopeBlocked
                ? t('progress.euroscope_running_message')
                : t('progress.subtitle_progress')}
        </p>
      </div>

      {hasError ? (
        <div className="px-4 py-3 text-sm text-red-400 border rounded-lg border-red-800/60 bg-red-950/30">
          {error}
        </div>
      ) : euroscopeBlocked ? (
        <div className="flex flex-col items-center gap-5 px-6 py-9 text-center rounded-2xl bg-zinc-800/40">
          <div className="relative flex items-center justify-center w-20 h-20">
            <span className="absolute inset-0 rounded-full bg-zinc-500/10 blur-xl animate-pulse" />
            <img
              src={EuroscopeLogo}
              alt="EuroScope"
              className="relative w-14 h-14 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            />
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-700 shadow-md shadow-black/50">
              <CloseIcon className="w-3 h-3 text-zinc-300" />
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="flex-shrink-0 w-3.5 h-3.5 border-2 rounded-full border-slate-700 border-t-zinc-300 animate-spin" />
            {t('progress.euroscope_running_waiting')}
          </div>

          <button
            type="button"
            onClick={checkEuroscopeAndInstall}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshIcon className="w-4 h-4" />
            {t('progress.euroscope_running_retry')}
          </button>
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
              <span className="text-xs text-slate-500">
                {t('progress.progress_label')}
              </span>
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
                    {t(`progress.task_${task.stage}`)}
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
              const needsUserInteraction = isActive;

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
                      {t(`extras_config.${extra.id}_name`)}
                    </span>
                    {needsUserInteraction && (
                      <p className="mt-0.5 text-xs text-amber-400/80">
                        {t('progress.extra_installer_open')}
                      </p>
                    )}
                    {isError && (
                      <p className="mt-0.5 text-xs text-red-400/70">
                        {t('progress.extra_install_failed')}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {(done || hasError || euroscopeBlocked) && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 rotate-180" />
            {t('nav.back')}
          </button>
          {done && (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t('nav.finish')}
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
