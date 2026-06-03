import { useConfigController } from '../../controllers/ConfigController.controller';
import type { StepProps } from '../../models/wizard.types';
import EuroscopeLogo from '../../../../assets/logo/euroscope.png';

const RANKS = [
  { value: '', label: 'Selecciona tu rango...' },
  { value: 'OBS', label: 'OBS — Observador' },
  { value: 'S1', label: 'S1 — Estudiante 1' },
  { value: 'S2', label: 'S2 — Estudiante 2' },
  { value: 'S3', label: 'S3 — Estudiante 3' },
  { value: 'C1', label: 'C1 — Controlador 1' },
  { value: 'C3', label: 'C3 — Controlador 3' },
  { value: 'I1', label: 'I1 — Instructor 1' },
  { value: 'I3', label: 'I3 — Instructor 3' },
  { value: 'SUP', label: 'SUP — Supervisor' },
  { value: 'ADM', label: 'ADM — Administrador' },
];

const FONT_SIZES = [
  { value: 'small', label: 'Pequeña' },
  { value: 'medium', label: 'Media' },
  { value: 'large', label: 'Grande' },
] as const;

const inputClass =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-colors';

const labelClass =
  'block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider';

export default function ConfigStepView({
  formData,
  setFormData,
  onNext,
  onBack,
}: StepProps) {
  const { pickSectorsFolder } = useConfigController(setFormData);



  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold font-akira text-slate-100">
          Datos de configuración
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Introduce tus credenciales y preferencias de VATSIM.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="cid">
            CID de VATSIM
          </label>
          <input
            id="cid"
            className={inputClass}
            type="text"
            inputMode="numeric"
            placeholder="Ej. 1234567"
            value={formData.cid}
            onChange={(e) => setFormData({ cid: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            className={inputClass}
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ password: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="name">
            Nombre en red
          </label>
          <div className="flex items-center gap-2">
            <input
              id="name"
              className={`${inputClass} flex-1`}
              type="text"
              placeholder="Ej. Pepe Viyuela"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="hoppieCode">
            Código Hoppie
          </label>
          <input
            id="hoppieCode"
            className={inputClass}
            type="text"
            placeholder="Tu código logon de Hoppie"
            value={formData.hoppieCode}
            onChange={(e) => setFormData({ hoppieCode: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="rank">
            Rango
          </label>
          <select
            id="rank"
            className={`${inputClass} appearance-none cursor-pointer`}
            value={formData.rank}
            onChange={(e) => setFormData({ rank: e.target.value })}
          >
            {RANKS.map((r) => (
              <option key={r.value} value={r.value} className="bg-slate-800">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className={labelClass}>Tipo de fuente</span>
          <div className="flex gap-2 mt-0.5">
            {FONT_SIZES.map((fs) => {
              const selected = formData.fontSize === fs.value;
              return (
                <label
                  key={fs.value}
                  className={[
                    'flex-1 flex items-center justify-center py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all select-none',
                    selected
                      ? 'bg-zinc-700 border-zinc-600 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="fontSize"
                    value={fs.value}
                    checked={selected}
                    onChange={() => setFormData({ fontSize: fs.value })}
                    className="sr-only"
                  />
                  {fs.label}
                </label>
              );
            })}
          </div>
        </div>

        <div className="col-span-2">
          <label className={labelClass} htmlFor="sectorsFolder">
            Carpeta de sectores de Euroscope
          </label>
          <div className="flex gap-0">
            <input
              id="sectorsFolder"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-l-lg px-3 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-colors min-w-0"
              type="text"
              readOnly
              placeholder="Selecciona la carpeta de sectores..."
              value={formData.sectorsFolder}
            />
            <button
              type="button"
              onClick={pickSectorsFolder}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 border-l-0 rounded-r-lg text-slate-300 text-sm font-medium transition-colors flex-shrink-0"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M1 3.5A1.5 1.5 0 012.5 2h3.172a1.5 1.5 0 011.06.44l.829.828A1.5 1.5 0 008.62 3.75H13.5A1.5 1.5 0 0115 5.25v7.25A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-9z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
              Examinar
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="checkbox-wrapper-26">
          <input
            type="checkbox"
            id="overwriteSettings"
            checked={formData.overwriteSettings}
            onChange={(e) =>
              setFormData({ overwriteSettings: e.target.checked })
            }
          />
          <label htmlFor="overwriteSettings">
            <div className="tick_mark" />
          </label>
        </div>
        <div>
          <span className="text-sm text-zinc-300">Sobreescribir settings</span>
          <p className="text-xs text-zinc-500">
            Tu configuración actual se borrará y los sectores instalados tendrán
            los ajustes por defecto
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white text-sm font-medium rounded-lg transition-colors"
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
        <button
          type="button"
          onClick={onNext}
          disabled={!formData.sectorsFolder}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Continuar
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
