import { MainNavTab } from '../components/Header';
import { UserProfile } from '../types';

export interface RouteMatch {
  tab: MainNavTab;
  subTab?: string;
  isLogin: boolean;
}

export const VALID_TABS: MainNavTab[] = [
  'dashboard',
  'pengajuan',
  'verifikasi',
  'arsip',
  'pedoman',
  'penomoran',
  'pengguna',
];

/**
 * Parsing path dari window.location.hash atau pathname
 * Mendukung hash route seperti '#/pengajuan', '#/penomoran/kosong', '#/login'
 */
export function parseCurrentRoute(): RouteMatch {
  let hash = window.location.hash || '';
  if (!hash && window.location.pathname && window.location.pathname !== '/') {
    hash = '#' + window.location.pathname;
  }

  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) {
    return { tab: 'dashboard', isLogin: false };
  }

  const parts = clean.split('/').filter(Boolean);
  const mainPart = (parts[0] || '').toLowerCase();
  const subPart = parts[1] || undefined;

  if (mainPart === 'login') {
    return { tab: 'dashboard', isLogin: true };
  }

  if (VALID_TABS.includes(mainPart as MainNavTab)) {
    return {
      tab: mainPart as MainNavTab,
      subTab: subPart,
      isLogin: false,
    };
  }

  return { tab: 'dashboard', isLogin: false };
}

/**
 * Membangun format URL hash yang konsisten
 */
export function createRouteUrl(tab: MainNavTab, subTab?: string, isLogin: boolean = false): string {
  if (isLogin) return '#/login';
  if (subTab) return `#/${tab}/${subTab}`;
  return `#/${tab}`;
}

/**
 * Mengubah URL dan mencatat ke browser history
 */
export function navigateTo(tab: MainNavTab, subTab?: string): void {
  const targetHash = createRouteUrl(tab, subTab);
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}

/**
 * Memeriksa apakah suatu tab diizinkan untuk peran pengguna saat ini
 */
export function checkTabPermission(tab: MainNavTab, user?: UserProfile | null): boolean {
  if (!user) return false;
  return Array.isArray(user.allowedTabs) && user.allowedTabs.includes(tab);
}
