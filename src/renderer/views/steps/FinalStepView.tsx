import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../../icons/Close.icon';
import { HappyFaceIcon } from '../../icons/HappyFace.icon';
import { SuccessCheckIcon } from '../../icons/SuccessCheck.icon';
import type { StepProps } from '../../models/wizard.types';

export default function FinalStepView(_: StepProps) {
  const { t } = useTranslation();
  const [euroscopeExists, setEuroscopeExists] = useState(false);

  useEffect(() => {
    window.electron.euroscope.exists().then(setEuroscopeExists);
  }, []);

  const launchAndClose = () => {
    window.electron.euroscope.launch();
    window.electron.app.close();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 py-8 text-center">
      <div className="flex items-center justify-center w-20 h-20 border rounded-full bg-emerald-900/50 border-emerald-600/40">
        <SuccessCheckIcon className="text-emerald-400" />
      </div>

      <div className="max-w-sm">
        <h2 className="text-2xl font-semibold font-akira text-slate-100">
          {t('final.title')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {t('final.subtitle')}
        </p>
      </div>
      <div className="flex flex-row gap-2">
        {euroscopeExists && (
          <button
            type="button"
            onClick={() => launchAndClose()}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-500 active:bg-orange-700"
          >
            {t('final.launch')}
            <HappyFaceIcon />
          </button>
        )}
        <button
          type="button"
          onClick={() => window.electron.app.close()}
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700"
        >
          {t('final.close')}
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
