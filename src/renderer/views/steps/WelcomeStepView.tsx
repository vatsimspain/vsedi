import { useState, useEffect } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard.component';
import type { StepProps } from '../../models/wizard.types';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';

const GITHUB_API =
  'https://api.github.com/repos/vatsimspain/Operaciones/releases/tags/vsedi';

type AiracEntry = { fir: string; date: string; airacId: string };

function dateStrToAiracId(raw: string): string {
  const anchor = Date.UTC(2025, 0, 23);
  const cycleMs = 28 * 24 * 60 * 60 * 1000;
  const y = parseInt(raw.slice(0, 4), 10);
  const m = parseInt(raw.slice(4, 6), 10) - 1;
  const d = parseInt(raw.slice(6, 8), 10);
  const totalCycles = Math.floor(
    (Date.UTC(y, m, d) - anchor) / cycleMs,
  );
  const yearOffset = Math.floor(totalCycles / 13);
  const cycleInYear = (totalCycles % 13) + 1;
  return `${25 + yearOffset}${String(cycleInYear).padStart(2, '0')}`;
}

function parseEntry(line: string): AiracEntry | null {
  const match = line.match(/^([^-]+)-AIRAC_(\d{8})$/);
  if (!match) return null;
  return {
    fir: match[1].trim(),
    date: match[2],
    airacId: dateStrToAiracId(match[2]),
  };
}

const FIR_PLACEHOLDERS = ['GCCC', 'LECB', 'LECM'];

export default function WelcomeStepView({ onNext }: StepProps) {
  const [githubAiracs, setGithubAiracs] = useState<AiracEntry[] | null>(null);
  const [airacError, setAiracError] = useState(false);
  const [installedAiracs, setInstalledAiracs] = useState<
    Record<string, string>
  >({});
  const [sectorsFolder, setSectorsFolder] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    window.electron.config
      .load()
      .then((cfg) => {
        const c = cfg as {
          installedAiracs?: Record<string, string>;
          sectorsFolder?: string;
          name?: string;
        };
        setInstalledAiracs(c.installedAiracs ?? {});
        setSectorsFolder(c.sectorsFolder ?? null);
        setName(c.name ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(GITHUB_API, {
          headers: { 'User-Agent': 'vsedi-installer' },
        });
        const release = (await res.json()) as {
          assets: { name: string; browser_download_url: string }[];
        };
        const asset = release.assets.find((a) => a.name === 'airacData.txt');
        if (!asset) throw new Error('airacData.txt no encontrado');
        const text = await (await fetch(asset.browser_download_url)).text();
        const entries = text
          .split(/\r?\n/)
          .filter(Boolean)
          .map(parseEntry)
          .filter((x): x is AiracEntry => x !== null);
        setGithubAiracs(entries);
      } catch {
        setAiracError(true);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-orange-500 font-akira">
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
                  const installedDate = installedAiracs[fir];
                  return installedDate ? (
                    <StatusCard
                      key={fir}
                      label={fir}
                      value={`AIRAC ${dateStrToAiracId(installedDate)}`}
                      ok={true}
                    />
                  ) : (
                    <StatusCard
                      key={fir}
                      label={fir}
                      value="Sin datos"
                      ok={false}
                    />
                  );
                })
              : githubAiracs!.map((entry) => (
                  <StatusCard
                    key={entry.fir}
                    label={entry.fir}
                    value={`AIRAC ${entry.airacId}`}
                    ok={installedAiracs[entry.fir] === entry.date}
                  />
                ))}
        </div>
      </div>

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
