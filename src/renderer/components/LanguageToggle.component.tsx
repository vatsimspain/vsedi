import { useTranslation } from 'react-i18next';
import FlagEN from '../../../assets/lang/en.png';
import FlagES from '../../../assets/lang/es.png';

const STORAGE_KEY = 'vsedi_language';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const isEN = i18n.language === 'en';

  const toggle = () => {
    const next = isEN ? 'es' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={isEN ? 'Cambiar a Español' : 'Switch to English'}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:bg-zinc-700/60 transition-colors select-none"
    >
      <img
        src={isEN ? FlagEN : FlagES}
        alt={isEN ? 'English' : 'Español'}
        className="w-5 h-5 rounded-sm object-cover"
      />
      <span className="text-xs font-semibold text-zinc-300">
        {isEN ? 'EN' : 'ES'}
      </span>
    </button>
  );
}
