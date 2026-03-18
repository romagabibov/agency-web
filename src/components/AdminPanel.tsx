import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { safeUrl, sanitizeKey, hashPassword, formatSeconds, daysLeft } from '../utils';
import { LogOut, Settings, Users, Image as ImageIcon, Trash2, Edit, AlertTriangle, Info, Globe, X } from 'lucide-react';
import { Model } from '../types';
import { Footer } from './Footer';

export const AdminPanel: React.FC = () => {
  const { lang, setLang, currentAdmin, setCurrentAdmin, sessionStartTime, setSessionStartTime, models, users, updateState, addNotification, logo, categories, notifications } = useAppContext();
  const t = translations[lang];

  const [search, setSearch] = useState('');
  const [editingModel, setEditingModel] = useState<Partial<Model>>({});
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [infoModel, setInfoModel] = useState<Model | null>(null);

  const [newAdminLogin, setNewAdminLogin] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  const [logoEdit, setLogoEdit] = useState(logo);
  const [filtersEdit, setFiltersEdit] = useState(categories.filter(c => c !== 'All').join(', '));
  const [pdfLogoFile, setPdfLogoFile] = useState<File | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAdminIdx, setConfirmDeleteAdminIdx] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleLogout = async () => {
    if (sessionStartTime && currentAdmin) {
      const spent = Math.floor((Date.now() - sessionStartTime) / 1000);
      const newUsers = [...users];
      const idx = newUsers.findIndex(u => u.login === currentAdmin);
      if (idx >= 0) {
        newUsers[idx] = { ...newUsers[idx], timeSpent: (newUsers[idx].timeSpent || 0) + spent };
        await updateState({ users: newUsers });
      }
    }
    setCurrentAdmin(null);
    setSessionStartTime(null);
  };

  const handleSaveSettings = async () => {
    const newCategories = ['All', ...filtersEdit.split(',').map(c => c.trim()).filter(Boolean)];
    let newPdfLogo = undefined;

    if (pdfLogoFile) {
      const formData = new FormData();
      formData.append('image', pdfLogoFile);
      try {
        const resp = await fetch(`https://api.imgbb.com/1/upload?key=d5a59366e85a615bbe2ee62cccaad99e`, { method: 'POST', body: formData });
        const data = await resp.json();
        if (data.success) {
          newPdfLogo = data.data.display_url || data.data.url;
        }
      } catch (e) {
        console.error('Error uploading pdf logo', e);
      }
    }

    await updateState({
      logo: logoEdit || 'BIG',
      categories: newCategories,
      ...(newPdfLogo ? { pdfLogo: newPdfLogo } : {})
    });
    setAlertMessage('Settings saved!');
  };

  const handleAddAdmin = async () => {
    if (!newAdminLogin || !newAdminPass) return;
    const hashed = await hashPassword(newAdminPass);
    await updateState({ users: [...users, { login: newAdminLogin, email: newAdminEmail || undefined, hash: hashed, timeSpent: 0 }] });
    await addNotification(`Admin ${newAdminLogin} was added by ${currentAdmin}`, 'success');
    setNewAdminLogin('');
    setNewAdminEmail('');
    setNewAdminPass('');
  };

  const executeDeleteAdmin = async () => {
    if (confirmDeleteAdminIdx === null) return;
    const newUsers = [...users];
    const deletedLogin = newUsers[confirmDeleteAdminIdx].login;
    newUsers.splice(confirmDeleteAdminIdx, 1);
    await updateState({ users: newUsers });
    await addNotification(`Admin ${deletedLogin} was deleted by ${currentAdmin}`, 'warning');
    setConfirmDeleteAdminIdx(null);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const id = editingModel.id || Date.now().toString();
      const existingIndex = models.findIndex(x => String(x.id) === String(id));
      const isNew = existingIndex < 0;
      let imgs = existingIndex >= 0 ? (models[existingIndex].imgs || []) : [];

      if (files && files.length > 0) {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const fd = new FormData();
          fd.append('image', files[i]);
          try {
            const resp = await fetch(`https://api.imgbb.com/1/upload?key=d5a59366e85a615bbe2ee62cccaad99e`, { method: 'POST', body: fd });
            const data = await resp.json();
            if (data.success) {
              uploadedUrls.push(data.data.display_url || data.data.url);
            }
          } catch (err) {
            console.error('Upload failed for image', i, err);
          }
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        }
        imgs = [...imgs, ...uploadedUrls];
      }

      const newModel: Model = {
        id,
        name: editingModel.name || '',
        modelLogin: sanitizeKey(editingModel.modelLogin || ''),
        modelPass: editingModel.modelPass || '',
        phone: editingModel.phone || '',
        insta: editingModel.insta || '',
        email: editingModel.email || '',
        status: editingModel.status || 'Active',
        contractStart: editingModel.contractStart || null,
        expiry: editingModel.expiry || null,
        payExpiry: editingModel.payExpiry || null,
        cat: editingModel.cat || categories[1] || 'All',
        height: editingModel.height || '',
        weight: editingModel.weight || '',
        shoe: editingModel.shoe || '',
        params: editingModel.params || '',
        shows: editingModel.shows || '',
        imgs,
        passHistory: existingIndex >= 0 ? (models[existingIndex].passHistory || []) : [],
        timeSpent: existingIndex >= 0 ? (models[existingIndex].timeSpent || 0) : 0,
        lastLogin: existingIndex >= 0 ? (models[existingIndex].lastLogin || undefined) : undefined
      };

      const newModels = [...models];
      if (existingIndex >= 0) newModels[existingIndex] = newModel;
      else newModels.push(newModel);

      await updateState({ models: newModels });
      await addNotification(`Model ${newModel.name} was ${isNew ? 'added' : 'updated'} by ${currentAdmin}`, 'success');
      setEditingModel({});
      setFiles(null);
      setAlertMessage('Model saved successfully!');
    } catch (error) {
      console.error('Error saving model:', error);
      setAlertMessage('Error saving model. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const executeDeleteModel = async () => {
    if (!confirmDeleteId) return;
    const modelToDelete = models.find(m => String(m.id) === String(confirmDeleteId));
    await updateState({ models: models.filter(m => String(m.id) !== String(confirmDeleteId)) });
    if (modelToDelete) {
      await addNotification(`Model ${modelToDelete.name} was deleted by ${currentAdmin}`, 'error');
    }
    setConfirmDeleteId(null);
  };

  const handleSetMainImage = async (modelId: string, imgIndex: number) => {
    const model = models.find(m => m.id === modelId);
    if (!model || !model.imgs || model.imgs.length <= 1 || imgIndex === 0) return;
    
    const newImgs = [...model.imgs];
    const [selectedImg] = newImgs.splice(imgIndex, 1);
    newImgs.unshift(selectedImg);
    
    const updatedModel = { ...model, imgs: newImgs };
    const newModels = models.map(m => m.id === modelId ? updatedModel : m);
    
    await updateState({ models: newModels });
    setInfoModel(updatedModel);
    await addNotification(`Main photo updated for ${model.name}`, 'success');
  };

  // Notifications logic
  const expiringContracts = models.filter(m => {
    const d = daysLeft(m.expiry);
    return d !== null && d <= 5 && d >= 0;
  });
  const expiringPayments = models.filter(m => {
    const d = daysLeft(m.payExpiry);
    return d !== null && d <= 5 && d >= 0;
  });
  const recentPassChanges = models.filter(m => m.passHistory && m.passHistory.length > 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-10 font-sans flex flex-col">
      <header className="bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black uppercase tracking-tighter text-white">{t.control_unit}</h2>
          <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-bold rounded-full border border-white/20 uppercase tracking-widest">
            {t.terminal_active} • {currentAdmin}
          </span>
        </div>
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

      <div className="max-w-7xl mx-auto px-6 pt-8 flex-grow w-full">
        {/* Notifications Panel */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 mb-8">
          <h3 className="text-lg font-black uppercase text-white mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-yellow-500"/> Notifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t.system_logs}</h4>
              {notifications.length === 0 ? <p className="text-sm text-zinc-600">No logs</p> : notifications.map(n => (
                <div key={n.id} className="text-xs text-zinc-300 mb-3 border-b border-white/5 pb-2 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                    <strong className="text-white text-sm">{n.message}</strong>
                  </div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest">{new Date(n.date).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t.contract_expiring}</h4>
              {expiringContracts.length === 0 ? <p className="text-sm text-zinc-600">{t.no_alerts}</p> : expiringContracts.map(m => (
                <div key={m.id} className="text-sm text-white mb-2 flex justify-between items-center"><span>{m.name}</span> <span className="text-red-500 font-bold text-xs bg-red-500/10 px-2 py-1 rounded-md">{daysLeft(m.expiry)} days</span></div>
              ))}
            </div>
            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t.payment_expiring}</h4>
              {expiringPayments.length === 0 ? <p className="text-sm text-zinc-600">{t.no_alerts}</p> : expiringPayments.map(m => (
                <div key={m.id} className="text-sm text-white mb-2 flex justify-between items-center"><span>{m.name}</span> <span className="text-red-500 font-bold text-xs bg-red-500/10 px-2 py-1 rounded-md">{daysLeft(m.payExpiry)} days</span></div>
              ))}
            </div>
            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t.recent_pass_changes}</h4>
              {recentPassChanges.length === 0 ? <p className="text-sm text-zinc-600">No recent changes</p> : recentPassChanges.slice().reverse().map(m => {
                const lastChange = m.passHistory![m.passHistory!.length - 1];
                return (
                  <div key={m.id} className="text-xs text-zinc-300 mb-3 border-b border-white/5 pb-2 last:border-0">
                    <strong className="text-white text-sm block mb-1">{m.name}</strong>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-zinc-500">Old:</span> <span className="line-through text-zinc-400">{lastChange.old}</span>
                      <span className="text-zinc-500">New:</span> <span className="text-green-400 font-bold">{lastChange.new}</span>
                    </div>
                    <div className="text-[9px] text-zinc-600 mt-1 uppercase tracking-widest">{new Date(lastChange.date).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {currentAdmin === 'admin' && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Settings size={16} /> {t.branding}</h3>
              <input type="text" value={logoEdit} onChange={e => setLogoEdit(e.target.value)} placeholder={t.agency_name} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-white/50 text-white" />
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t.resume_categories}</label>
              <textarea value={filtersEdit} onChange={e => setFiltersEdit(e.target.value)} placeholder="Woman, Man, Kids..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 h-24 outline-none focus:ring-2 focus:ring-white/50 text-white"></textarea>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t.resume_logo}</label>
              <input type="file" accept="image/png,image/jpeg" onChange={e => setPdfLogoFile(e.target.files?.[0] || null)} className="w-full text-sm mb-6 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 text-zinc-400" />
              <button onClick={handleSaveSettings} className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-xl transition-colors uppercase tracking-widest text-xs">{t.sync}</button>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={16} /> {t.admin_access}</h3>
              <div className="space-y-2 mb-6">
                {users.map((u, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/50 p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="font-bold text-sm text-white block">{u.login}</span>
                      {u.email && <span className="text-[10px] text-zinc-400 block">{u.email}</span>}
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mt-1">Time: {formatSeconds(u.timeSpent || 0)}</span>
                      {u.lastLogin && <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Last Login: {new Date(u.lastLogin).toLocaleString()}</span>}
                    </div>
                    {u.login !== 'admin' ? (
                      <button onClick={() => setConfirmDeleteAdminIdx(i)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t.root}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-white/5 space-y-3">
                <input type="text" value={newAdminLogin} onChange={e => setNewAdminLogin(e.target.value)} placeholder="Login" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="Email (for Google Login)" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                <input type="password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} placeholder="Security Key" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                <button onClick={handleAddAdmin} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-colors border border-white/10 mt-2 uppercase tracking-widest text-xs">{t.add_admin}</button>
              </div>
            </div>
          </div>
        )}

        <div className={currentAdmin === 'admin' ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-black uppercase text-white mb-6 tracking-tight italic">{editingModel.id ? t.edit_talent : t.add_new_talent}</h3>
            <form onSubmit={handleSaveModel} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mb-2">{t.profile_details}</h4>
                <input type="text" value={editingModel.name || ''} onChange={e => setEditingModel({...editingModel, name: e.target.value})} placeholder={t.full_name} required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={editingModel.modelLogin || ''} onChange={e => setEditingModel({...editingModel, modelLogin: e.target.value})} placeholder={t.portal_login} required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                  <input type="text" value={editingModel.modelPass || ''} onChange={e => setEditingModel({...editingModel, modelPass: e.target.value})} placeholder={t.portal_password} required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" value={editingModel.phone || ''} onChange={e => setEditingModel({...editingModel, phone: e.target.value})} placeholder={t.phone} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                  <input type="text" value={editingModel.insta || ''} onChange={e => setEditingModel({...editingModel, insta: e.target.value})} placeholder={t.instagram} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                  <input type="email" value={editingModel.email || ''} onChange={e => setEditingModel({...editingModel, email: e.target.value})} placeholder={t.email} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.status}</label>
                    <select value={editingModel.status || 'Active'} onChange={e => setEditingModel({...editingModel, status: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white">
                      <option value="Active">{t.active}</option>
                      <option value="Inactive">{t.inactive}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.contract_start}</label>
                    <input type="date" value={editingModel.contractStart || ''} onChange={e => setEditingModel({...editingModel, contractStart: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.contract_expiry}</label>
                    <input type="date" value={editingModel.expiry || ''} onChange={e => setEditingModel({...editingModel, expiry: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.payment_expiry}</label>
                    <input type="date" value={editingModel.payExpiry || ''} onChange={e => setEditingModel({...editingModel, payExpiry: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                  </div>
                </div>
                <select value={editingModel.cat || categories[1] || 'All'} onChange={e => setEditingModel({...editingModel, cat: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" value={editingModel.height || ''} onChange={e => setEditingModel({...editingModel, height: e.target.value})} placeholder={t.height.toUpperCase()} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                  <input type="number" value={editingModel.weight || ''} onChange={e => setEditingModel({...editingModel, weight: e.target.value})} placeholder={t.weight.toUpperCase()} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                  <input type="number" value={editingModel.shoe || ''} onChange={e => setEditingModel({...editingModel, shoe: e.target.value})} placeholder={t.shoe.toUpperCase()} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
                </div>
                <input type="text" value={editingModel.params || ''} onChange={e => setEditingModel({...editingModel, params: e.target.value})} placeholder={t.measurements_placeholder} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white" />
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mb-2">{t.media_biography}</h4>
                <textarea value={editingModel.shows || ''} onChange={e => setEditingModel({...editingModel, shows: e.target.value})} placeholder={t.career_highlights} className="flex-1 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white min-h-[160px]"></textarea>
                <div className="p-6 border-2 border-dashed border-white/10 rounded-2xl text-center bg-black/50 hover:bg-black transition-colors">
                  <ImageIcon className="mx-auto text-zinc-500 mb-2" size={24} />
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2 cursor-pointer">{t.upload_portfolio}</label>
                  <input type="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)} className="text-xs text-zinc-500 w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                </div>
                {isUploading && (
                  <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                    <div className="bg-white h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
                <button type="submit" disabled={isUploading} className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 px-4 rounded-xl transition-colors mt-auto disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm">
                  {isUploading ? `${t.saving} ${uploadProgress}%` : t.deploy}
                </button>
                {editingModel.id && (
                  <button type="button" onClick={() => setEditingModel({})} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl transition-colors border border-white/10 uppercase tracking-widest text-xs">
                    {t.cancel_edit}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">{t.talent_database}</h3>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search_name} className="w-full md:max-w-sm bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/50 text-white shadow-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {models
            .filter(m => String(m.name || '').toLowerCase().includes(search.toLowerCase()))
            .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
            .map(m => (
            <div key={m.id} className="bg-zinc-900/50 p-4 rounded-2xl shadow-sm border border-white/5 flex items-center justify-between hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-4">
                <img src={safeUrl(m.imgs?.[0], 'img')} alt={m.name} className="w-12 h-12 rounded-full object-cover bg-black" />
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{m.name || '—'}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                    {m.cat || '—'} <span className="mx-1">•</span> Login: <span className="text-white">{m.modelLogin}</span> <span className="mx-1">•</span> Pass: <span className="text-white">{m.modelPass}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setInfoModel(m)} className="p-2 text-zinc-400 hover:text-blue-400 bg-white/5 hover:bg-blue-400/20 rounded-lg transition-colors"><Info size={16} /></button>
                <button onClick={() => setEditingModel(m)} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><Edit size={16} /></button>
                <button onClick={() => setConfirmDeleteId(m.id)} className="p-2 text-zinc-400 hover:text-red-500 bg-white/5 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Controls */}
        {Math.ceil(models.filter(m => String(m.name || '').toLowerCase().includes(search.toLowerCase())).length / ITEMS_PER_PAGE) > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Prev
            </button>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Page {currentPage} of {Math.ceil(models.filter(m => String(m.name || '').toLowerCase().includes(search.toLowerCase())).length / ITEMS_PER_PAGE)}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(models.filter(m => String(m.name || '').toLowerCase().includes(search.toLowerCase())).length / ITEMS_PER_PAGE), p + 1))}
              disabled={currentPage === Math.ceil(models.filter(m => String(m.name || '').toLowerCase().includes(search.toLowerCase())).length / ITEMS_PER_PAGE)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {infoModel && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setInfoModel(null)}>
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setInfoModel(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-black uppercase text-white mb-6">{infoModel.name}</h3>
            <div className="space-y-3 text-sm text-zinc-300">
              <p><strong className="text-white">Email:</strong> {infoModel.email || '—'}</p>
              <p><strong className="text-white">Phone:</strong> {infoModel.phone || '—'}</p>
              <p><strong className="text-white">Instagram:</strong> {infoModel.insta || '—'}</p>
              <p><strong className="text-white">Status:</strong> {infoModel.status}</p>
              <p><strong className="text-white">Category:</strong> {infoModel.cat}</p>
              <p><strong className="text-white">Contract Start:</strong> {infoModel.contractStart || '—'}</p>
              <p><strong className="text-white">Contract Expiry:</strong> {infoModel.expiry || '—'}</p>
              <p><strong className="text-white">Payment Expiry:</strong> {infoModel.payExpiry || '—'}</p>
              <div className="pt-4 border-t border-white/10 mt-4">
                <p><strong className="text-white">{t.total_time_spent}:</strong> {formatSeconds(infoModel.timeSpent || 0)}</p>
                {infoModel.lastLogin && <p><strong className="text-white">{t.last_login}:</strong> {new Date(infoModel.lastLogin).toLocaleString()}</p>}
              </div>
              {infoModel.imgs && infoModel.imgs.length > 0 && (
                <div className="pt-4 border-t border-white/10 mt-4">
                  <p className="text-white font-bold mb-2 uppercase tracking-widest text-[10px]">Select Main Photo</p>
                  <div className="grid grid-cols-4 gap-2">
                    {infoModel.imgs.map((img, idx) => (
                      <div 
                        key={idx} 
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${idx === 0 ? 'border-green-500' : 'border-transparent hover:border-white/50'}`}
                        onClick={() => handleSetMainImage(infoModel.id, idx)}
                      >
                        <img src={safeUrl(img, 'img')} alt={`Photo ${idx}`} className="w-full h-16 object-cover" />
                        {idx === 0 && <div className="absolute top-0 left-0 bg-green-500 text-white text-[8px] font-bold px-1 py-0.5 uppercase">Main</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-black uppercase text-white mb-2">{t.delete_talent}</h3>
            <p className="text-sm text-zinc-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-colors uppercase tracking-widest text-xs">{t.cancel}</button>
              <button onClick={executeDeleteModel} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors uppercase tracking-widest text-xs">{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteAdminIdx !== null && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDeleteAdminIdx(null)}>
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-black uppercase text-white mb-2">{t.delete_admin}</h3>
            <p className="text-sm text-zinc-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDeleteAdminIdx(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-colors uppercase tracking-widest text-xs">{t.cancel}</button>
              <button onClick={executeDeleteAdmin} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors uppercase tracking-widest text-xs">{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setAlertMessage(null)}>
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black uppercase text-white mb-6">{alertMessage}</h3>
            <button onClick={() => setAlertMessage(null)} className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-xl transition-colors uppercase tracking-widest text-xs">OK</button>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};
