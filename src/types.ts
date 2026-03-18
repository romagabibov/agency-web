export interface PassChange {
  date: string;
  old: string;
  new: string;
}

export interface NotificationEvent {
  id: string;
  date: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
}

export interface Model {
  id: string;
  name: string;
  modelLogin: string;
  modelPass: string;
  phone: string;
  insta: string;
  email: string;
  status: string;
  contractStart?: string | null;
  expiry: string | null;
  payExpiry: string | null;
  cat: string;
  height: string;
  weight: string;
  shoe: string;
  params: string;
  shows: string;
  imgs: string[];
  passHistory?: PassChange[];
  timeSpent?: number;
  lastLogin?: string;
}

export interface User {
  login: string;
  email?: string;
  hash?: string;
  pass?: string;
  timeSpent?: number;
  lastLogin?: string;
}

export interface AppState {
  lang: 'ru' | 'az' | 'en';
  logo: string;
  categories: string[];
  models: Model[];
  users: User[];
  pdfLogo: string | null;
  lastLoginTime: Record<string, Record<string, number>>;
  notifications: NotificationEvent[];
}
