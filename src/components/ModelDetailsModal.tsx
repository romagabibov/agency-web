import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { safeUrl } from '../utils';
import { motion } from 'framer-motion';
import { X, Phone, Instagram } from 'lucide-react';

export const ModelDetailsModal: React.FC<{ modelId: string; onClose: () => void }> = ({ modelId, onClose }) => {
  const { models, lang } = useAppContext();
  const t = translations[lang];
  const m = models.find(x => String(x.id) === String(modelId));
  const [mainImg, setMainImg] = useState(safeUrl(m?.imgs?.[0], 'img'));

  if (!m) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-zinc-950 w-full max-w-6xl rounded-3xl md:rounded-[40px] flex flex-col md:flex-row overflow-hidden relative max-h-[90vh] shadow-2xl border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors z-50"
        >
          <X size={24} />
        </button>

        <div className="w-full md:w-1/2 p-4 flex flex-col justify-center bg-black/50 overflow-hidden">
          <div className="relative h-[50vh] md:h-[70vh] rounded-2xl overflow-hidden shadow-inner bg-black">
            <img
              src={mainImg}
              alt={m.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex gap-3 mt-4 overflow-x-auto w-full justify-start pb-2 px-2 snap-x">
            {(m.imgs || []).map((src, idx) => (
              <img
                key={idx}
                src={safeUrl(src, 'img')}
                alt={`thumb-${idx}`}
                className={`h-20 w-16 object-cover rounded-xl cursor-pointer transition-all snap-center shadow-sm ${
                  mainImg === safeUrl(src, 'img') ? 'ring-2 ring-white opacity-100 scale-105' : 'opacity-40 hover:opacity-100'
                }`}
                onClick={() => setMainImg(safeUrl(src, 'img'))}
              />
            ))}
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center overflow-y-auto">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-2 italic">{m.name || '—'}</h2>
          <p className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-8">{m.cat || '—'}</p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center shadow-sm">
              <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-widest">{t.height}</span>
              <p className="text-2xl font-bold text-white mt-1">{m.height || '—'} <span className="text-sm text-zinc-500">{t.cm}</span></p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center shadow-sm">
              <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-widest">{t.shoe}</span>
              <p className="text-2xl font-bold text-white mt-1">{m.shoe || '—'}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center shadow-sm col-span-2">
              <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-widest">{t.params}</span>
              <p className="text-xl font-bold text-white mt-1">{m.params || '-'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-6 mt-4">
              <a href="https://www.instagram.com/bigmodelagency/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                <Instagram size={24} />
              </a>
              <a href="tel:+994518928672" className="text-zinc-500 hover:text-white transition-colors">
                <Phone size={24} />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
