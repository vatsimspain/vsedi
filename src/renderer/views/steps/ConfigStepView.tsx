import { useTranslation } from 'react-i18next';
import { FONT_SIZES } from '../../../const/fontSize';
import { RANKS } from '../../../const/ranks';
import { useConfigController } from '../../controllers/ConfigController.controller';
import { ArrowRightIcon } from '../../icons/ArrowRight.icon';
import { FolderIcon } from '../../icons/Folder.icon';
import type { StepProps } from '../../models/wizard.types';

export default function ConfigStepView({
  formData,
  setFormData,
  onNext,
  onBack,
}: StepProps) {
  const { t } = useTranslation();
  const { pickSectorsFolder } = useConfigController(setFormData);

  const inputClass =
    'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-colors';

  const labelClass =
    'block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold font-akira text-slate-100">
          {t('config.title')}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {t('config.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="cid">
            {t('config.cid')}
          </label>
          <input
            id="cid"
            className={inputClass}
            type="text"
            inputMode="numeric"
            placeholder={t('config.cid_placeholder')}
            value={formData.cid}
            onChange={(e) => setFormData({ cid: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="password">
            {t('config.password')}
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
            {t('config.name')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="name"
              className={`${inputClass} flex-1`}
              type="text"
              placeholder={t('config.name_placeholder')}
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="hoppieCode">
            {t('config.hoppie')}
          </label>
          <input
            id="hoppieCode"
            className={inputClass}
            type="text"
            placeholder={t('config.hoppie_placeholder')}
            value={formData.hoppieCode}
            onChange={(e) => setFormData({ hoppieCode: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="rank">
            {t('config.rank')}
          </label>
          <select
            id="rank"
            className={`${inputClass} appearance-none cursor-pointer`}
            value={formData.rank}
            onChange={(e) => setFormData({ rank: e.target.value })}
          >
            {RANKS.map((r) => (
              <option key={r.value} value={r.value} className="bg-slate-800">
                {t(`ranks.${r.value || 'placeholder'}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className={labelClass}>{t('config.font_size')}</span>
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
                  {t(`font_sizes.${fs.value}`)}
                </label>
              );
            })}
          </div>
        </div>

        <div className="col-span-2">
          <label className={labelClass} htmlFor="sectorsFolder">
            {t('config.sectors_folder')}
          </label>
          <div className="flex gap-0">
            <input
              id="sectorsFolder"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-l-lg px-3 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-colors min-w-0"
              type="text"
              readOnly
              placeholder={t('config.sectors_placeholder')}
              value={formData.sectorsFolder}
            />
            <button
              type="button"
              onClick={pickSectorsFolder}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 border-l-0 rounded-r-lg text-slate-300 text-sm font-medium transition-colors flex-shrink-0"
            >
              <FolderIcon />
              {t('config.browse')}
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
          <span className="text-sm text-zinc-300">{t('config.overwrite_label')}</span>
          <p className="text-xs text-zinc-500">
            {t('config.overwrite_desc')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="checkbox-wrapper-26">
          <input
            type="checkbox"
            id="backupAndCleanSectors"
            checked={formData.backupAndCleanSectors}
            onChange={(e) =>
              setFormData({ backupAndCleanSectors: e.target.checked })
            }
          />
          <label htmlFor="backupAndCleanSectors">
            <div className="tick_mark" />
          </label>
        </div>
        <div>
          <span className="text-sm text-zinc-300">
            {t('config.backup_label')}
          </span>
          <p className="text-xs text-zinc-500">
            {t('config.backup_desc')}
          </p>
        </div>
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
        <button
          type="button"
          onClick={onNext}
          disabled={!formData.sectorsFolder}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {t('nav.continue')}
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
