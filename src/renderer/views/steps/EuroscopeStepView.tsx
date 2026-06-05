import { useEffect, useState } from 'react';
import EuroscopeLogo from '../../../../assets/logo/euroscope.png';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';
import type { StepProps } from '../../models/wizard.types';

const VERSIONS = [
  {
    id: 'recommended',
    version: '3.2.3.2',
    description: 'Versión recomendada por VATSIM Spain',
    url: 'https://euroscope.hu/install/EuroScopeSetup.3.2.3.2.msi',
    recommended: true,
  },
  {
    id: 'latest',
    version: '3.2.13',
    description: 'Última versión disponible',
    url: 'https://euroscope.hu/install/EuroScopeSetup.3.2.13.msi',
    recommended: false,
  },
];

type Phase =
  | 'checking'
  | 'found'
  | 'not_found'
  | 'downloading'
  | 'installing'
  | 'error';

export default function EuroscopeStepView({ onNext, onBack }: StepProps) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [exePath, setExePath] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    window.electron.euroscope
      .getInfo()
      .then(({ installed, exePath: p, version: v }) => {
        setExePath(p);
        setVersion(v);
        setPhase(installed ? 'found' : 'not_found');
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
      // onInstallProgress may return an unsubscribe function or an IPC object;
      // ensure cleanup only calls if unsub is a function to satisfy EffectCallback
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_) {
        // ignore
      }
    };
  }, []);

  const handleInstall = async (url: string) => {
    setErrorMsg(null);
    setDownloadPercent(0);
    setPhase('downloading');
    const result = await window.electron.euroscope.installMsi(url);
    if (result.success) {
      const info = await window.electron.euroscope.getInfo();
      setExePath(info.exePath);
      setVersion(info.version);
      setPhase(info.installed ? 'found' : 'not_found');
    } else {
      setErrorMsg(result.error ?? 'Error desconocido');
      setPhase('error');
    }
  };

  const isWorking = phase === 'downloading' || phase === 'installing';
  const showVersionCards = phase === 'not_found' || phase === 'error';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-start gap-4">
        <img src={EuroscopeLogo} alt="EuroScope Logo" className="w-16" />
        <div className="flex flex-col gap-2 mb-4">
          <h2 className="text-xl font-semibold font-akira text-slate-100">
            EuroScope
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Verificando si EuroScope está instalado y listo para usar. Si no lo
            está, puedes instalarlo fácilmente desde aquí.
          </p>
        </div>
      </div>

      {phase === 'checking' && (
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <div className="flex-shrink-0 w-4 h-4 border-2 rounded-full border-slate-600 border-t-zinc-300 animate-spin" />
          Buscando tu instalación de Euroscope...
        </div>
      )}

      {phase === 'found' && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border bg-emerald-950/30 border-emerald-700/40">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-900/60 border border-emerald-600/50 flex-shrink-0 mt-0.5">
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
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-400">
              EuroScope está instalado
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
              ? `Descargando... ${downloadPercent}%`
              : 'Instalando EuroScope...'}
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
              El instalador de EuroScope se ha abierto. Completa la instalación
              y ciérralo para continuar.
            </p>
          )}
        </div>
      )}

      {showVersionCards && (
        <div className="flex flex-col gap-3">
          {phase === 'not_found' && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border bg-amber-950/20 border-amber-700/40">
              <svg
                className="flex-shrink-0 mt-0.5"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M8 2L14.5 13.5H1.5L8 2Z"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 6.5v3M8 11.5v.5"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-sm text-amber-300/80">
                EuroScope no está instalado. Selecciona una versión para
                instalarlo o continúa sin él.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {VERSIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleInstall(v.url)}
                className={[
                  'flex flex-col items-start gap-1.5 px-4 py-3.5 rounded-xl border text-left transition-colors',
                  v.recommended
                    ? 'bg-orange-950/30 border-orange-700/50 hover:bg-orange-900/30'
                    : 'bg-zinc-800/60 border-slate-700/40 hover:bg-zinc-700/60',
                ].join(' ')}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${v.recommended ? 'text-orange-300' : 'text-slate-200'}`}
                  >
                    v{v.version}
                  </span>
                  {v.recommended && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-orange-600/40 text-orange-300 font-medium">
                      Recomendada
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500">{v.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isWorking}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M13 8H3M7 12l-4-4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Atrás
        </button>

        <div className="flex items-center gap-2">
          {showVersionCards && (
            <button
              type="button"
              onClick={onNext}
              className="px-3 py-2 text-xs transition-colors text-slate-500 hover:text-slate-400"
            >
              Omitir
            </button>
          )}
          {phase === 'found' && (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Continuar
              <ArrowRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
