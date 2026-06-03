import { useEffect, useState } from 'react';

type UpdateState = 'idle' | 'available' | 'downloaded' | 'error';

export default function UpdateBanner() {
  const [state, setState] = useState<UpdateState>('idle');
  const [version, setVersion] = useState<string>('');
  const [percent, setPercent] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    window.electron.update.onAvailable((info: any) => {
      setVersion(info?.version ?? '');
      setState('available');
    });

    window.electron.update.onProgress((progress: any) => {
      setPercent(Math.round(progress?.percent ?? 0));
    });

    window.electron.update.onDownloaded((info: any) => {
      setVersion(info?.version ?? '');
      setState('downloaded');
    });

    window.electron.update.onError((message: string) => {
      setErrorMsg(message);
      setState('error');
    });
  }, []);

  if (state === 'idle') return null;

  const bgColor =
    state === 'downloaded'
      ? 'bg-green-600'
      : state === 'error'
        ? 'bg-red-600'
        : 'bg-blue-600';

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-white text-sm shadow-lg ${bgColor}`}
    >
      <span>
        {state === 'available' &&
          `Descargando actualización${version ? ` v${version}` : ''}... ${percent > 0 ? `${percent}%` : ''}`}
        {state === 'downloaded' &&
          `Actualización lista${version ? ` (v${version})` : ''}, reinicia para aplicarla`}
        {state === 'error' && `Error en la actualización: ${errorMsg}`}
      </span>
      {state === 'downloaded' && (
        <button
          type="button"
          onClick={() => window.electron.update.install()}
          className="ml-4 px-3 py-1 bg-white text-green-700 font-semibold rounded hover:bg-green-50 transition-colors"
        >
          Reiniciar ahora
        </button>
      )}
    </div>
  );
}
