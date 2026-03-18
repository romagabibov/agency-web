import React, { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue, set, update } from 'firebase/database';
import { db } from '../firebase';
import { AppState, Model, User, NotificationEvent } from '../types';

interface AppContextType extends AppState {
  setLang: (lang: 'ru' | 'az' | 'en') => void;
  updateState: (newState: Partial<AppState>) => Promise<void>;
  addNotification: (message: string, type?: 'info' | 'warning' | 'success' | 'error') => Promise<void>;
  currentAdmin: string | null;
  setCurrentAdmin: (admin: string | null) => void;
  currentModel: Model | null;
  setCurrentModel: (model: Model | null) => void;
  sessionStartTime: number | null;
  setSessionStartTime: (time: number | null) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    lang: (localStorage.getItem('lastLang') as 'ru' | 'az' | 'en') || 'ru',
    logo: 'BIG',
    categories: ['All'],
    models: [],
    users: [],
    pdfLogo: null,
    lastLoginTime: {},
    notifications: [],
  });
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dbRef = ref(db, 'agency_cloud_v1');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      let users = Array.isArray(data.users) ? data.users : [];
      if (users.length === 0) {
        users = [{ login: "admin", hash: "5d3a967f3c2f77278067583633916955acea6bc8e3500f3d4ded8c74827cf3e604c49450f6294dfde71ef6710efe6430" }];
      }

      setState(prev => ({
        ...prev,
        logo: data.logo || 'BIG',
        categories: Array.isArray(data.categories) ? data.categories : ['All'],
        models: Array.isArray(data.models) ? data.models : (data.models ? Object.values(data.models) : []),
        users,
        pdfLogo: data.pdfLogo || null,
        lastLoginTime: data.lastLoginTime || {},
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
      }));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setLang = (lang: 'ru' | 'az' | 'en') => {
    localStorage.setItem('lastLang', lang);
    setState(prev => ({ ...prev, lang }));
  };

  const updateState = async (newState: Partial<AppState>) => {
    // Remove any undefined values which Firebase Realtime Database rejects
    const cleanNewState = JSON.parse(JSON.stringify(newState));
    // We don't save lang to DB
    delete cleanNewState.lang;
    
    if (Object.keys(cleanNewState).length > 0) {
      await update(ref(db, 'agency_cloud_v1'), cleanNewState);
    }
  };

  const addNotification = async (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    const newNotif: NotificationEvent = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      type,
      message
    };
    const newNotifications = [newNotif, ...state.notifications].slice(0, 150);
    await updateState({ notifications: newNotifications });
  };

  return (
    <AppContext.Provider value={{
      ...state,
      setLang,
      updateState,
      addNotification,
      currentAdmin,
      setCurrentAdmin,
      currentModel,
      setCurrentModel,
      sessionStartTime,
      setSessionStartTime,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
