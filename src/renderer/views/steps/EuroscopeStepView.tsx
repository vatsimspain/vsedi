import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EuroscopeLogo from '../../../../assets/logo/euroscope.png';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';
import type { StepProps } from '../../models/wizard.types';
import { TickIcon } from '../../icons/TickIcon.icon';
import { CloseIcon } from '../../icons/Close.icon';
import { CheckMarkIcon } from '../../icons/CheckMark.icon';
import { FolderIcon } from '../../icons/Folder.icon';
import { CheckBadgeIcon } from '../../icons/CheckBadge.icon';

const VERSIONS = [
  {
    id: 'recommended',
    version: '3.2.3.2',
    descriptionKey: 'euroscope.version_recommended',
    url: 'https://euroscope.hu/install/EuroScopeSetup.3.2.3.2.msi',
    recommended: true,
  },
  {
    id: 'latest',
    version: '3.2.13',
    descriptionKey: 'euroscope.version_latest',
    url: 'https://euroscope.hu/install/EuroScopeSetup.3.2.13.msi',
    recommended: false,
  },
];

type Phase =
  | 'loading'
  | 'ask'
  | 'pick'
  | 'found'
  | 'install'
  | 'downloading'
  | 'installing'
  | 'error';

export default function EuroscopeStepView({ onNext, onBack }: StepProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('loading');
  const [exePath, setExePath] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  useEffect(() => {
    window.electron.euroscope
      .getInfo()
      .then(({ installed, exePath: p, version: v }) => {
        if (installed) {
          setExePath(p);
          setVersion(v);
          setPhase('found');
        } else {
          setPhase('ask');
        }
      });

    const unsub = window.electron.euroscope.onInstallProgress(
      ({ stage, percent }) => {
        if (stage === 'downloading') {
          setPhase('downloading');
          setDownloadPercent(percent);
        } else if (stage === 'installing') {
          setPhase('installing');
        }
      },
    );
    return () => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_) {}
    };
  }, []);

  const handleBrowse = async () => {
    const selected = await window.electron.euroscope.browse();
    if (!selected) return;
    await window.electron.config.save({ euroscopePath: selected });
    const info = await window.electron.euroscope.getInfo();
    setExePath(info.exePath);
    setVersion(info.version);
    setPhase(info.installed ? 'found' : 'pick');
  };

  const handleForget = async () => {
    await window.electron.config.save({ euroscopePath: '' });
    setExePath(null);
    setVersion(null);
    setPhase('ask');
  };

  const handleInstall = async (url: string) => {
    setErrorMsg(null);
    setDownloadPercent(0);
    setPhase('downloading');
    const result = await window.electron.euroscope.installMsi(url);
    if (result.success) {
      setPhase('pick');
    } else {
      setErrorMsg(result.error ?? t('euroscope.error_unknown'));
      setPhase('error');
    }
  };

  const isWorking = phase === 'downloading' || phase === 'installing';

  const handleBack = () => {
    if (phase === 'pick' || phase === 'install' || phase === 'error') {
      setPhase('ask');
    } else {
      onBack();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-start gap-4">
        <img src={EuroscopeLogo} alt="EuroScope Logo" className="w-16" />
        <div className="flex flex-col gap-2 mb-4">
          <h2 className="text-xl font-semibold font-akira text-slate-100">
            {t('euroscope.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {t('euroscope.subtitle')}
          </p>
        </div>
      </div>

      {phase === 'loading' && (
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <div className="flex-shrink-0 w-4 h-4 border-2 rounded-full border-slate-600 border-t-zinc-300 animate-spin" />
          {t('euroscope.loading')}
        </div>
      )}

      {phase === 'ask' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-300">
            {t('euroscope.ask_question')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPhase('pick')}
              className="flex flex-row items-center gap-3 px-4 py-3.5 rounded-xl border bg-zinc-800/60 border-slate-700/40 hover:bg-zinc-700/60 transition-colors text-left"
            >
              <TickIcon className="w-5 h-5 text-green-400" />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-200">
                  {t('euroscope.ask_yes')}
                </span>
                <span className="text-xs text-slate-500">
                  {t('euroscope.ask_yes_hint')}
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPhase('install')}
              className="flex flex-row items-center gap-3 px-4 py-3.5 rounded-xl border bg-zinc-800/60 border-slate-700/40 hover:bg-zinc-700/60 transition-colors text-left"
            >
              <CloseIcon className="w-5 h-5 text-red-400" />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-200">
                  {t('euroscope.ask_no')}
                </span>
                <span className="text-xs text-slate-500">
                  {t('euroscope.ask_no_hint')}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {phase === 'pick' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-400">
            {t('euroscope.pick_prompt_pre')}{' '}
            <span className="text-slate-200">EuroScope.exe</span>{' '}
            {t('euroscope.pick_prompt_post')}
          </p>
          <button
            type="button"
            onClick={handleBrowse}
            className="self-start flex items-center gap-2 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <FolderIcon />
            {t('euroscope.pick_button')}
          </button>
          <p className="text-xs text-slate-500">
            {t('euroscope.pick_default_path')}
          </p>
        </div>
      )}

      {phase === 'found' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border bg-emerald-950/30 border-emerald-700/40">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-900/60 border border-emerald-600/50 flex-shrink-0 mt-0.5">
              <CheckMarkIcon className="text-emerald-400" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-400">
                {t('euroscope.found_configured')}
                {version && (
                  <span className="ml-2 text-xs font-normal text-emerald-600">
                    v{version}
                  </span>
                )}
              </p>
              {exePath && (
                <p
                  className="mt-0.5 text-xs text-slate-500 truncate"
                  title={exePath}
                >
                  {exePath}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleForget}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-800/40 transition-all"
          >
            <CloseIcon className="w-3 h-3" />
            {t('euroscope.found_forget')}
          </button>
        </div>
      )}

      {phase === 'install' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-400">
            {t('euroscope.install_select_version')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {VERSIONS.map((v) => {
              const selected = selectedVersionId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVersionId(v.id)}
                  className={[
                    'group relative flex flex-col items-start gap-2 px-4 py-4 rounded-xl border text-left transition-all duration-150',
                    selected
                      ? 'bg-gradient-to-br from-blue-900/70 to-indigo-900/50 border-blue-400/60 shadow-md shadow-blue-950/50'
                      : v.recommended
                        ? 'bg-gradient-to-br from-blue-950/60 to-indigo-950/40 border-blue-600/40 hover:border-blue-500/60 hover:from-blue-900/60 hover:to-indigo-900/40 shadow-sm shadow-blue-950/40'
                        : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600/60 hover:bg-zinc-700/50',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${selected || v.recommended ? 'text-blue-200' : 'text-slate-300'}`}
                    >
                      v{v.version}
                    </span>
                    {v.recommended && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium">
                        {t('euroscope.install_recommended_badge')}
                      </span>
                    )}
                    {selected && (
                      <span className="flex items-center justify-center flex-shrink-0 w-4 h-4 ml-auto bg-blue-500 rounded-full">
                        <CheckBadgeIcon className="text-white" />
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-xs ${selected || v.recommended ? 'text-blue-400/70' : 'text-slate-500'}`}
                  >
                    {t(v.descriptionKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="px-4 py-3 text-sm text-red-400 border rounded-lg border-red-800/60 bg-red-950/30">
          {errorMsg}
        </div>
      )}

      {isWorking && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <div className="flex-shrink-0 w-4 h-4 border-2 rounded-full border-slate-600 border-t-zinc-300 animate-spin" />
            {phase === 'downloading'
              ? t('euroscope.downloading', { percent: downloadPercent })
              : t('euroscope.installing')}
          </div>
          {phase === 'downloading' && (
            <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-300 rounded-full transition-[width] duration-150"
                style={{ width: `${downloadPercent}%` }}
              />
            </div>
          )}
          {phase === 'installing' && (
            <p className="text-xs text-slate-500">
              {t('euroscope.install_prompt')}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleBack}
          disabled={isWorking}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
        >
          <ArrowRightIcon className="w-4 h-4 rotate-180" />
          {t('nav.back')}
        </button>

        <div className="flex items-center gap-2">
          {(phase === 'ask' ||
            phase === 'install' ||
            phase === 'pick' ||
            phase === 'error') && (
            <button
              type="button"
              onClick={onNext}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-slate-400 hover:text-slate-300 text-sm font-medium rounded-lg border border-zinc-700/50 transition-colors"
            >
              {t('nav.skip')}
            </button>
          )}
          {phase === 'install' && selectedVersionId && (
            <button
              type="button"
              onClick={() => {
                const v = VERSIONS.find((ver) => ver.id === selectedVersionId);
                if (v) handleInstall(v.url);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t('euroscope.install_button', {
                version: VERSIONS.find((v) => v.id === selectedVersionId)?.version,
              })}
              <ArrowRightIcon />
            </button>
          )}
          {phase === 'found' && (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t('nav.continue')}
              <ArrowRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
