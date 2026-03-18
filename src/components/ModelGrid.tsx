import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { safeUrl } from '../utils';
import { motion } from 'framer-motion';
import { ModelDetailsModal } from './ModelDetailsModal';

export const ModelGrid: React.FC<{ filter: { minH: number; maxW: number; queryP: string; cat: string } }> = ({ filter }) => {
  const { models, lang } = useAppContext();
  const t = translations[lang];
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const qParams = (filter.queryP || '').toLowerCase();

  const filtered = models.filter(m => {
    const catOk = filter.cat === 'All' || m.cat === filter.cat;
    const hVal = parseInt(m.height || '0', 10);
    const hOk = isNaN(hVal) ? true : hVal >= (filter.minH || 0);
    const wVal = parseInt(m.weight || '999', 10);
    const wOk = isNaN(wVal) ? true : wVal <= (filter.maxW || 999);
    const pOk = String(m.params || '').toLowerCase().includes(qParams);
    const nameOk = !filter.searchName || String(m.name || '').toLowerCase().includes(filter.searchName.toLowerCase());
    const activeOk = m.status ? m.status !== 'Inactive' : true;
    return catOk && hOk && wOk && pOk && nameOk && activeOk;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const localizeCategory = (cat: string) => {
    const c = String(cat || '').trim().toLowerCase();
    if (['woman','women','female','девушки','девушка','qadınlar','qadinlar','qadin','qadın'].includes(c)) return t.woman;
    if (['man','men','male','мужчины','мужчина','kişilər','kisiler','kisi','kişi'].includes(c)) return t.man;
    if (['kids','children','дети','uşaqlar','usaqlar','uşaq','usaq'].includes(c)) return t.kids;
    return cat || '—';
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6 md:p-12">
        {filtered.map(m => (
          <motion.div
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-white/5 flex flex-col"
            whileHover={{ y: -4 }}
          >
            <div className="aspect-[3/4] overflow-hidden bg-black relative">
              <img
                src={safeUrl(m.imgs?.[0], 'img')}
                alt={m.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="p-5 flex justify-between items-end bg-zinc-900/80 flex-1 border-t border-white/5">
              <div>
                <h3 className="font-bold text-white text-lg leading-tight mb-1 uppercase italic">{m.name || '—'}</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{localizeCategory(m.cat)}</p>
              </div>
              <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded-md">
                {m.height || '—'} {t.cm}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedModel && (
        <ModelDetailsModal
          modelId={selectedModel}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </>
  );
};
