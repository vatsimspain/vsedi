import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';
import type { StepProps } from '../../models/wizard.types';

const GITHUB_API =
  'https://api.github.com/repos/vatsimspain/Operaciones/releases/tags/vsedi';

export default function ChangelogStepView({ onNext, onBack }: StepProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await window.electron.http.getText(GITHUB_API);
        const release = JSON.parse(raw) as {
          assets: { name: string; browser_download_url: string }[];
        };
        const asset = release.assets.find(
          (a) => a.name.toLowerCase() === 'releasenotes.md',
        );
        if (!asset) throw new Error('releaseNotes.MD no encontrado');
        const md = await window.electron.http.getText(asset.browser_download_url);
        setContent(md);
      } catch {
        setError(true);
      }
    })();
  }, []);

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

      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl bg-zinc-900/70 border border-slate-700/40 px-5 py-4 text-sm text-slate-300 leading-relaxed">
        {error ? (
          <p className="text-red-400">No se pudieron cargar las novedades.</p>
        ) : content === null ? (
          <p className="text-slate-500 animate-pulse">Cargando novedades…</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold text-slate-100 mt-4 mb-2 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-slate-100 mt-4 mb-2 first:mt-0">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold text-slate-200 mt-3 mb-1">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-3 space-y-1 text-slate-300">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-3 space-y-1 text-slate-300">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noreferrer">{children}</a>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-slate-100">{children}</strong>
              ),
              code: ({ children }) => (
                <code className="bg-zinc-800 text-slate-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
              ),
              hr: () => (
                <hr className="border-slate-700/60 my-4" />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>

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
