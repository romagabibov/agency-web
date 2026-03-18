import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { ModelGrid } from './components/ModelGrid';
import { FilterModal } from './components/FilterModal';
import { LoginModal } from './components/LoginModal';
import { AdminPanel } from './components/AdminPanel';
import { ModelCabinet } from './components/ModelCabinet';
import { Loader2 } from 'lucide-react';
import { translations } from './translations';

const MainApp: React.FC = () => {
  const { currentAdmin, currentModel, isLoading, categories, lang } = useAppContext();
  const t = translations[lang];
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [filter, setFilter] = useState({ minH: 0, maxW: 999, queryP: '', cat: 'All', searchName: '' });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold tracking-widest uppercase text-sm">{t.loading_system}</p>
      </div>
    );
  }

  if (currentAdmin) {
    return <AdminPanel />;
  }

  if (currentModel) {
    return <ModelCabinet />;
  }

  return (
    <Layout>
      <Header
        onOpenFilter={() => setIsFilterOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />
      
      <main className="max-w-[1600px] mx-auto">
        <div className="px-6 md:px-12 pt-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter({ ...filter, cat: c })}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                  filter.cat === c 
                    ? 'bg-white text-black border-white shadow-md' 
                    : 'bg-black/50 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {c === 'All' ? t.all_talents : c}
              </button>
            ))}
          </div>
          <div className="w-full md:w-64">
            <input 
              type="text" 
              placeholder={t.search_name} 
              value={filter.searchName}
              onChange={e => setFilter({ ...filter, searchName: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:ring-2 focus:ring-white/50 outline-none"
            />
          </div>
        </div>
        <ModelGrid filter={filter} />
      </main>

      {isFilterOpen && (
        <FilterModal
          filter={filter}
          setFilter={setFilter}
          onClose={() => setIsFilterOpen(false)}
        />
      )}

      {isLoginOpen && (
        <LoginModal onClose={() => setIsLoginOpen(false)} />
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
