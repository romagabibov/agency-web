import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { safeUrl, daysLeft } from '../utils';
import { LogOut, Download, AlertTriangle, Globe } from 'lucide-react';
import { Footer } from './Footer';

export const ModelCabinet: React.FC = () => {
  const { lang, setLang, currentModel, setCurrentModel, sessionStartTime, setSessionStartTime, pdfLogo, models, updateState, addNotification } = useAppContext();
  const t = translations[lang];

  const [newPass, setNewPass] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogout = async () => {
    if (sessionStartTime && currentModel) {
      const spent = Math.floor((Date.now() - sessionStartTime) / 1000);
      const newModels = [...models];
      const idx = newModels.findIndex(m => m.id === currentModel.id);
      if (idx >= 0) {
        newModels[idx] = { ...newModels[idx], timeSpent: (newModels[idx].timeSpent || 0) + spent };
        await updateState({ models: newModels });
      }
    }
    setCurrentModel(null);
    setSessionStartTime(null);
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      // 10 minutes = 600,000 ms
      timeout = setTimeout(() => {
        handleLogout();
      }, 600000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [currentModel, sessionStartTime, models]);

  if (!currentModel) return null;

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newPass) return;
    const history = currentModel.passHistory || [];
    const updatedHistory = [...history, { date: new Date().toISOString(), old: currentModel.modelPass, new: newPass }];
    const updatedModel = { ...currentModel, modelPass: newPass, passHistory: updatedHistory };
    const newModels = models.map(m => m.id === currentModel.id ? updatedModel : m);
    await updateState({ models: newModels });
    await addNotification(`Model ${currentModel.name} changed password`, 'info');
    setCurrentModel(updatedModel);
    setNewPass('');
    setSuccessMsg('Password successfully updated!');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleDownloadResume = async () => {
    const div = document.createElement('div');
    div.style.padding = "50px";
    div.style.background = "#fff";
    div.style.color = "#000";
    div.style.fontFamily = "sans-serif";

    const escapeHtml = (str: string) => !str ? '' : String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const showsText = escapeHtml(currentModel.shows || 'Professional experience data.');
    const modelPhoto = safeUrl(currentModel.imgs?.[0], 'img');
    const agencyLogo = safeUrl(pdfLogo, 'img');

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #000; padding-bottom:30px; margin-bottom:40px;">
        <img src="${agencyLogo}" style="height:115px; object-fit:contain;">
        <div style="text-align:right">
          <h2 style="font-size:32px; text-transform:uppercase; margin:0;">${escapeHtml(currentModel.name)}</h2>
          <p style="color:#777; font-size:12px; letter-spacing:3px; margin-bottom: 8px;">TALENT CARD</p>
          <p style="color:#444; font-size:10px; margin: 0; font-weight: bold;">AMAY Ticarət Mərkəzi, 7 mərtəbə, Baku 1122</p>
          <p style="color:#444; font-size:10px; margin: 0; font-weight: bold;">+994 51 892 86 72</p>
        </div>
      </div>
      <div style="display:flex; gap:40px; align-items:flex-start;">
        <div style="flex: 0 0 45%;">
          <img src="${modelPhoto}" style="width:100%; height:auto; max-height:500px; object-fit:contain; border-radius:10px;">
        </div>
        <div style="flex: 1;">
          <div style="margin-bottom:25px;">
            <h3 style="background:#000; color:#fff; padding:6px 12px; font-size:13px; text-transform:uppercase; border-radius:4px;">Physical Profile</h3>
            <div style="padding:10px; font-size:15px; line-height:1.8;">
              <p style="margin:0 0 5px 0;"><b>Height:</b> ${escapeHtml(currentModel.height || '-')} cm</p>
              <p style="margin:0 0 5px 0;"><b>Weight:</b> ${escapeHtml(currentModel.weight || '-')} kg</p>
              <p style="margin:0 0 5px 0;"><b>Shoe:</b> ${escapeHtml(currentModel.shoe || '-')}</p>
              <p style="margin:0 0 5px 0;"><b>Meas:</b> ${escapeHtml(currentModel.params || '-')}</p>
            </div>
          </div>
          <div style="margin-bottom:25px;">
            <h3 style="background:#000; color:#fff; padding:6px 12px; font-size:13px; text-transform:uppercase; border-radius:4px;">Contact Details</h3>
            <div style="padding:10px; font-size:14px; line-height:1.6;">
              <p style="margin:0 0 5px 0;"><b>Tel:</b> ${escapeHtml(currentModel.phone || '-')}</p>
              <p style="margin:0 0 5px 0;"><b>Insta:</b> ${escapeHtml(currentModel.insta || '-')}</p>
              <p style="margin:0 0 5px 0;"><b>Email:</b> ${escapeHtml(currentModel.email || '-')}</p>
            </div>
          </div>
          <div>
            <h3 style="background:#000; color:#fff; padding:6px 12px; font-size:13px; text-transform:uppercase; border-radius:4px;">Experience</h3>
            <div style="padding:10px; font-size:13px; color:#444; line-height:1.5; white-space:pre-line;">
              ${showsText}
            </div>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `${(currentModel.name || 'model')}_BIG.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().from(div).set(opt).save();
    } else {
      alert('PDF generation library not loaded.');
    }
  };

  const getExpiryColor = (dateStr: string | null) => {
    const dl = daysLeft(dateStr);
    if (dl === null) return 'text-white';
    if (dl <= 10 && dl >= 0) return 'text-red-500 font-black';
    return 'text-white';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-10 font-sans flex flex-col">
      <header className="bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Talent Portal</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
            <Globe size={14} className="text-zinc-400" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as 'ru' | 'en' | 'az')}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer uppercase tracking-widest"
            >
              <option value="ru" className="bg-zinc-900">RU</option>
              <option value="en" className="bg-zinc-900">EN</option>
              <option value="az" className="bg-zinc-900">AZ</option>
            </select>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-semibold transition-colors border border-red-500/20">
            <LogOut size={16} />
            {t.exit}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 flex-grow w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-8 gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-2 italic truncate">{currentModel.name || '—'}</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.prof_model_interface}</p>
          </div>
          <button onClick={handleDownloadResume} className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-md whitespace-nowrap uppercase tracking-widest text-xs shrink-0">
            <Download size={16} />
            {t.generate_pdf}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-12">
          <div className="bg-zinc-900/50 p-4 lg:p-6 rounded-2xl shadow-sm border border-white/5 text-center flex flex-col justify-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.height}</span>
            <b className="text-lg lg:text-xl text-white">{currentModel.height || '—'} <span className="text-xs lg:text-sm text-zinc-500">{t.cm}</span></b>
          </div>
          <div className="bg-zinc-900/50 p-4 lg:p-6 rounded-2xl shadow-sm border border-white/5 text-center flex flex-col justify-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.weight}</span>
            <b className="text-lg lg:text-xl text-white">{currentModel.weight || '—'} <span className="text-xs lg:text-sm text-zinc-500">{t.kg}</span></b>
          </div>
          <div className="bg-zinc-900/50 p-4 lg:p-6 rounded-2xl shadow-sm border border-white/5 text-center flex flex-col justify-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.shoe}</span>
            <b className="text-lg lg:text-xl text-white">{currentModel.shoe || '—'}</b>
          </div>
          <div className="bg-zinc-900/50 p-4 lg:p-6 rounded-2xl shadow-sm border border-white/5 text-center flex flex-col justify-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.status}</span>
            <b className="text-lg lg:text-xl text-white">{currentModel.status === 'Inactive' ? t.inactive : t.active}</b>
          </div>
          {currentModel.contractStart && (
            <div className="bg-zinc-900/50 p-4 lg:p-6 rounded-2xl shadow-sm border border-white/5 text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Start</span>
              <b className="text-sm lg:text-lg text-white flex items-center justify-center gap-1">
                {currentModel.contractStart}
              </b>
            </div>
          )}
          <div className="bg-zinc-900/50 p-4 lg:p-6 rounded-2xl shadow-sm border border-white/5 text-center flex flex-col justify-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.expiry}</span>
            <b className={`text-sm lg:text-lg ${getExpiryColor(currentModel.expiry)} flex items-center justify-center gap-1`}>
              {currentModel.expiry || '-'}
              {daysLeft(currentModel.expiry) !== null && daysLeft(currentModel.expiry)! <= 10 && <AlertTriangle size={14} className="text-red-500" />}
            </b>
          </div>
          <div className="bg-zinc-900/50 p-4 lg:p-6 rounded-2xl shadow-sm border border-white/5 text-center flex flex-col justify-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.payment}</span>
            <b className={`text-sm lg:text-lg ${getExpiryColor(currentModel.payExpiry)} flex items-center justify-center gap-1`}>
              {currentModel.payExpiry || '-'}
              {daysLeft(currentModel.payExpiry) !== null && daysLeft(currentModel.payExpiry)! <= 10 && <AlertTriangle size={14} className="text-red-500" />}
            </b>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 p-8 rounded-3xl shadow-sm border border-white/5 h-fit">
            <h3 className="text-[10px] font-black uppercase mb-6 text-zinc-500 tracking-widest">{t.career_history}</h3>
            <div className="text-zinc-300 italic text-sm leading-relaxed whitespace-pre-line break-words">
              {currentModel.shows || t.no_data}
            </div>
          </div>
          <div className="lg:col-span-2 bg-zinc-900/50 p-8 rounded-3xl shadow-sm border border-white/5">
            <h3 className="text-[10px] font-black uppercase mb-8 text-zinc-500 tracking-widest">{t.visual_portfolio}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(currentModel.imgs || []).map((src, idx) => (
                <img
                  key={idx}
                  src={safeUrl(src, 'img')}
                  alt={`portfolio-${idx}`}
                  className="aspect-[3/4] object-cover rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-black"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-zinc-900/50 p-8 rounded-3xl shadow-sm border border-white/5">
          <h3 className="text-[10px] font-black uppercase mb-6 text-zinc-500 tracking-widest">{t.security_settings}</h3>
          <form onSubmit={handleChangePass} className="flex flex-col sm:flex-row gap-4 max-w-md">
            <input 
              type="password" 
              value={newPass} 
              onChange={e => setNewPass(e.target.value)} 
              placeholder={t.new_password} 
              className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white"
              required 
              minLength={6}
            />
            <button type="submit" className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded-xl transition-colors uppercase tracking-widest text-xs whitespace-nowrap">
              {t.change_password}
            </button>
          </form>
          {successMsg && <p className="text-green-500 text-xs font-bold uppercase tracking-widest mt-4">{successMsg}</p>}
        </div>

      </div>
      <Footer />
    </div>
  );
};
