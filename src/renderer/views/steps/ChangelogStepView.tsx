import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';
import type { StepProps } from '../../models/wizard.types';

const GITHUB_API =
  'https://api.github.com/repos/vatsimspain/Operaciones/releases/tags/vsedi';

const MD_COMPONENTS = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="mt-4 mb-2 text-xl font-bold text-slate-100 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-4 mb-2 text-lg font-semibold text-slate-100 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="mt-3 mb-1 text-base font-semibold text-slate-200">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-3 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-3 space-y-1 list-disc list-inside text-slate-300">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-3 space-y-1 list-decimal list-inside text-slate-300">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href} className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noreferrer">{children}</a>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-slate-100">{children}</strong>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-zinc-800 text-slate-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
  ),
  hr: () => (
    <hr className="my-4 border-slate-700/60" />
  ),
};

type ColumnState = { content: string | null; error: boolean };

export default function ChangelogStepView({ onNext, onBack }: StepProps) {
  const { t } = useTranslation();
  const [vsedi, setVsedi] = useState<ColumnState>({ content: null, error: false });
  const [operaciones, setOperaciones] = useState<ColumnState>({ content: null, error: false });

  useEffect(() => {
    (async () => {
      try {
        const raw = await window.electron.http.getText(GITHUB_API);
        const release = JSON.parse(raw) as {
          assets: { name: string; browser_download_url: string }[];
        };

        const vsediAsset = release.assets.find(
          (a) => a.name.toLowerCase() === 'vsedichangelog.md',
        );
        if (vsediAsset) {
          const md = await window.electron.http.getText(vsediAsset.browser_download_url);
          setVsedi({ content: md, error: false });
        } else {
          setVsedi({ content: null, error: true });
        }

        const opAsset = release.assets.find(
          (a) => a.name.toLowerCase() === 'releasenotes.md',
        );
        if (opAsset) {
          const md = await window.electron.http.getText(opAsset.browser_download_url);
          setOperaciones({ content: md, error: false });
        } else {
          setOperaciones({ content: null, error: true });
        }
      } catch {
        setVsedi({ content: null, error: true });
        setOperaciones({ content: null, error: true });
      }
    })();
  }, []);

  function renderColumn(state: ColumnState) {
    if (state.error) return <p className="text-red-400">{t('changelog.loadError')}</p>;
    if (state.content === null) return <p className="text-slate-500 animate-pulse">{t('changelog.loading')}</p>;
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
        {state.content}
      </ReactMarkdown>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h1 className="text-2xl font-semibold leading-tight font-akira text-slate-100">
          {t('changelog.title')}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {t('changelog.subtitle')}
        </p>
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-2 gap-4">
        <div className="flex flex-col min-h-0">
          <p className="mb-2 text-xs font-medium tracking-wider uppercase text-slate-500">VSEDI</p>
          <div className="flex-1 px-5 py-4 overflow-y-auto text-sm leading-relaxed border rounded-xl bg-zinc-900/70 border-slate-700/40 text-slate-300">
            {renderColumn(vsedi)}
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <p className="mb-2 text-xs font-medium tracking-wider uppercase text-slate-500">Airac</p>
          <div className="flex-1 px-5 py-4 overflow-y-auto text-sm leading-relaxed border rounded-xl bg-zinc-900/70 border-slate-700/40 text-slate-300">
            {renderColumn(operaciones)}
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ArrowRightIcon className="rotate-180" />
          {t('nav.back')}
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {t('nav.continue')}
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
