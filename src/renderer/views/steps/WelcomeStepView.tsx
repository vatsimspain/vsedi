import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import StatusCard from '../../components/StatusCard/StatusCard.component';
import type { StepProps } from '../../models/wizard.types';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';

const GITHUB_API =
  'https://api.github.com/repos/vatsimspain/Operaciones/releases/tags/vsedi';

type AiracEntry = { fir: string; date: string };
type InstalledEntry = { date: string; cycle: string };
type InstalledMap = Record<string, InstalledEntry[]>;

function parseEntry(line: string): AiracEntry | null {
  const match = line.match(/^([^-]+)-AIRAC_(\d{8})$/);
  if (!match) return null;
  return { fir: match[1].trim(), date: match[2] };
}

const FIR_PLACEHOLDERS = ['GCCC', 'LECB', 'LECM'];

export default function WelcomeStepView({ onNext }: StepProps) {
  const [githubAiracs, setGithubAiracs] = useState<AiracEntry[] | null>(null);
  const [airacError, setAiracError] = useState(false);
  const [installedAiracs, setInstalledAiracs] = useState<InstalledMap>({});
  const [sectorsFolder, setSectorsFolder] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<string | null>(null);
  const [changelogError, setChangelogError] = useState(false);

  useEffect(() => {
    window.electron.config
      .load()
      .then(async (cfg) => {
        const c = cfg as { sectorsFolder?: string; name?: string };
        setName(c.name ?? null);
        const folder = c.sectorsFolder ?? null;
        setSectorsFolder(folder);
        if (folder) {
          const scanned = await window.electron.airac.scan(folder);
          setInstalledAiracs(scanned);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await window.electron.http.getText(GITHUB_API);
        const release = JSON.parse(raw) as {
          assets: { name: string; browser_download_url: string }[];
        };
        const airacAsset = release.assets.find((a) => a.name === 'airacData.txt');
        if (!airacAsset) throw new Error('airacData.txt no encontrado');
        const text = await window.electron.http.getText(airacAsset.browser_download_url);
        const entries = text
          .split(/\r?\n/)
          .filter(Boolean)
          .map(parseEntry)
          .filter((x): x is AiracEntry => x !== null);
        setGithubAiracs(entries);

        const changelogAsset = release.assets.find((a) => a.name.toLowerCase() === 'vsedichangelog.md');
        if (changelogAsset) {
          const md = await window.electron.http.getText(changelogAsset.browser_download_url);
          setChangelog(md);
        }
      } catch {
        setAiracError(true);
        setChangelogError(true);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-white font-akira">
          Bienvenido a VSEDI{name ? `, ${name}` : ''}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Este asistente te guiará en la configuración de AIRACs, plugins y otras configuraciones específicas para los controladores de VATSIM Spain.
        </p>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium tracking-wider uppercase text-slate-500">
          AIRAC por FIR
        </p>
        <div className="grid grid-cols-3 gap-3">
          {githubAiracs === null && !airacError
            ? FIR_PLACEHOLDERS.map((fir) => (
                <div
                  key={fir}
                  className="flex items-center gap-3 bg-zinc-800/60 rounded-xl px-4 py-3.5 border border-slate-700/40 animate-pulse"
                >
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-slate-600" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">{fir}</div>
                    <div className="h-3.5 w-16 bg-slate-700 rounded mt-1.5" />
                  </div>
                </div>
              ))
            : airacError
              ? FIR_PLACEHOLDERS.map((fir) => {
                  const entries = installedAiracs[fir];
                  const latest = entries?.[entries.length - 1];
                  return (
                    <StatusCard
                      key={fir}
                      label={fir}
                      value={latest ? `AIRAC ${latest.cycle}` : 'Sin datos'}
                      status={latest ? 'warn' : 'error'}
                    />
                  );
                })
              : githubAiracs!.map((entry) => {
                  const entries = installedAiracs[entry.fir];
                  const matched = entries?.find((e) => e.date === entry.date);
                  const latest = entries?.[entries.length - 1];
                  const status = matched ? 'ok' : latest ? 'warn' : 'error';
                  const value = matched
                    ? `AIRAC ${matched.cycle}`
                    : latest
                      ? `Desactualizado (${latest.cycle})`
                      : 'No instalado';
                  return (
                    <StatusCard
                      key={entry.fir}
                      label={entry.fir}
                      value={value}
                      status={status}
                    />
                  );
                })}

        </div>
      </div>

      {(changelog !== null || changelogError) && (
        <div>
          <p className="mb-2 text-xs font-medium tracking-wider uppercase text-slate-500">
            Novedades
          </p>
          <div className="px-5 py-4 overflow-y-auto text-sm leading-relaxed border max-h-48 rounded-xl bg-zinc-900/70 border-slate-700/40 text-slate-300">
            {changelogError ? (
              <p className="text-red-400">No se pudieron cargar las novedades.</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="mt-4 mb-2 text-xl font-bold text-slate-100 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="mt-4 mb-2 text-lg font-semibold text-slate-100 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="mt-3 mb-1 text-base font-semibold text-slate-200">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 space-y-1 list-disc list-inside text-slate-300">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 space-y-1 list-decimal list-inside text-slate-300">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  a: ({ href, children }) => <a href={href} className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noreferrer">{children}</a>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
                  code: ({ children }) => <code className="bg-zinc-800 text-slate-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                  hr: () => <hr className="my-4 border-slate-700/60" />,
                }}
              >
                {changelog!}
              </ReactMarkdown>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-1">
        {sectorsFolder && (
          <div>
            <div className="text-xs text-slate-500">
              Última carpeta de sectores
            </div>
            <div
              className="text-slate-200 text-sm font-medium mt-0.5 truncate"
              title={sectorsFolder}
            >
              {sectorsFolder}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Comenzar
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
