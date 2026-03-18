import React from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { Filter, LogIn, LogOut } from 'lucide-react';

interface HeaderProps {
  onOpenFilter: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFilter, onOpenLogin }) => {
  const { lang, setLang, logo, currentAdmin, currentModel, setCurrentAdmin, setCurrentModel, setSessionStartTime } = useAppContext();
  const t = translations[lang];

  const handleLogout = () => {
    setCurrentAdmin(null);
    setCurrentModel(null);
    setSessionStartTime(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-sm">
      <h1 className="text-2xl font-black uppercase tracking-tighter text-white cursor-pointer italic" onClick={() => window.location.reload()}>
        {logo}
      </h1>
      
      <div className="flex items-center gap-4">
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          {(['ru', 'az', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                lang === l ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenFilter}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-semibold transition-colors border border-white/5"
        >
          <Filter size={16} />
          <span className="hidden sm:inline">{t.filter}</span>
        </button>

        {currentAdmin || currentModel ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-semibold transition-colors border border-red-500/20"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t.exit}</span>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <LogIn size={16} />
            <span className="hidden sm:inline">{t.access}</span>
          </button>
        )}
      </div>
    </header>
  );
};
