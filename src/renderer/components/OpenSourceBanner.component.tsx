import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GitHubIcon } from '../icons/GitHub.icon';
import { CloseIcon } from '../icons/Close.icon';

const STORAGE_KEY = 'vsedi_opensource_dismissed';

export default function OpenSourceBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-slate-800/90 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl border border-slate-600/50 max-w-lg w-full mx-4">
      <GitHubIcon />
      <p className="flex-1 leading-relaxed text-slate-200">
        {t('opensource.text_pre')}{' '}
        <a
          href="https://github.com/vatsimspain/vsedi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline hover:text-slate-300"
        >
          {t('opensource.link_label')}
        </a>
        {t('opensource.text_mid')}{' '}
        <a
          href="mailto:operaciones@vatsimspain.es"
          className="text-white underline hover:text-slate-300"
        >
          operaciones@vatsimspain.es
        </a>
        .
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('opensource.dismiss')}
        className="transition-colors shrink-0 text-slate-400 hover:text-white"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
