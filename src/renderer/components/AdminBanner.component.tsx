import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../icons/Close.icon';

export default function AdminBanner() {
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    window.electron.app
      .isAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin || dismissed) return null;

  return (
    <div className="flex items-center flex-shrink-0 gap-3 px-4 py-2 text-sm text-white shadow-lg bg-amber-600">
      <span className="text-lg leading-none">⚠</span>
      <p className="flex-1 leading-relaxed">{t('admin.warning')}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t('admin.dismiss')}
        className="transition-colors shrink-0 text-amber-100 hover:text-white"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
