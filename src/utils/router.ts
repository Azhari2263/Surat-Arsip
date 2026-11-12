import { useEffect, useState, useCallback } from 'react';
import { MainNavTab } from '../components/Header';
import { UserProfile } from '../types';

export type AppRoute =
  | '/login'
  | '/dashboard'
  | '/pengajuan'
  | '/verifikasi'
  | '/arsip'
  | '/pedoman'
  | '/penomoran'
  | '/pengguna';

const TAB_TO_ROUTE: Record<MainNavTab, AppRoute> = {
  dashboard: '/dashboard',
  pengajuan: '/pengajuan',
  verifikasi: '/verifikasi',
  arsip: '/arsip',
  pedoman: '/pedoman',
  penomoran: '/penomoran',
  pengguna: '/pengguna',
};

const ROUTE_TO_TAB: Record<string, MainNavTab> = {
  '/dashboard': 'dashboard',
  '/pengajuan': 'pengajuan',
  '/verifikasi': 'verifikasi',
  '/arsip': 'arsip',
  '/pedoman': 'pedoman',
  '/penomoran': 'penomoran',
  '/pengguna': 'pengguna',
};

/**
 * Membaca path saat ini dari pathname (atau hash jika ada)
 */
export function getCurrentPath(): string {
  if (typeof window === 'undefined') return '/dashboard';

  // Cek pathname terlebih dahulu
  let path = window.location.pathname.toLowerCase();
  
  // Jika path di root '/' tapi ada hash seperti '#/arsip', gunakan hash
  if (path === '/' || path === '') {
    const hash = window.location.hash.toLowerCase().replace(/^#/, '');
    if (hash && hash.startsWith('/')) {
      path = hash;
    }
  }

  // Bersihkan trailing slash kecuali root
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  return path;
}

/**
 * Mengubah URL browser menggunakan HTML5 History API secara konsisten
 */
export function pushRoute(route: string, replace = false): void {
  if (typeof window === 'undefined') return;

  const current = getCurrentPath();
  if (current === route) return;

  if (replace) {
    window.history.replaceState({ route }, '', route);
  } else {
    window.history.pushState({ route }, '', route);
  }

  // Trigger popstate event untuk subscriber
  window.dispatchEvent(new PopStateEvent('popstate', { state: { route } }));
}

/**
 * Konversi Tab ke URL Route
 */
export function tabToRoute(tab: MainNavTab): AppRoute {
  return TAB_TO_ROUTE[tab] || '/dashboard';
}

/**
 * Konversi URL Route ke Tab
 */
export function routeToTab(route: string): MainNavTab | null {
  const cleanRoute = route.split('?')[0].split('#')[0];
  return ROUTE_TO_TAB[cleanRoute] || null;
}

/**
 * Hook Router Terpadu untuk Navigasi & Proteksi Hak Akses Role
 */
export function useAppRouter(
  currentUser: UserProfile | null,
  activeTab: MainNavTab,
  setActiveTab: (tab: MainNavTab) => void,
  onAccessDenied?: (msg: string) => void
) {
  const [currentPath, setCurrentPath] = useState<string>(() => getCurrentPath());

  // Sinkronisasi rute URL saat tab berubah dari UI
  const navigateToTab = useCallback(
    (tab: MainNavTab) => {
      // Validasi kewenangan role
      if (currentUser && !currentUser.allowedTabs.includes(tab)) {
        if (onAccessDenied) {
          onAccessDenied(`✕ Akses ditolak: Peran Anda tidak memiliki kewenangan ke halaman ini.`);
        }
        return;
      }

      const targetRoute = tabToRoute(tab);
      pushRoute(targetRoute);
      setActiveTab(tab);
      setCurrentPath(targetRoute);
    },
    [currentUser, setActiveTab, onAccessDenied]
  );

  // Penanganan Navigasi Langsung via URL, Refresh, Back/Forward Browser
  useEffect(() => {
    const handleLocationChange = () => {
      const path = getCurrentPath();
      setCurrentPath(path);

      // Jika belum login dan mengakses halaman selain /login
      if (!currentUser) {
        if (path !== '/login') {
          pushRoute('/login', true);
        }
        return;
      }

      // Jika sudah login tapi mengakses /login atau root /
      if (path === '/login' || path === '/') {
        const defaultTab: MainNavTab = currentUser.allowedTabs.includes('dashboard')
          ? 'dashboard'
          : currentUser.allowedTabs[0] || 'pengajuan';
        const defaultRoute = tabToRoute(defaultTab);
        pushRoute(defaultRoute, true);
        setActiveTab(defaultTab);
        return;
      }

      // Validasi route ke tab aplikasi
      const matchedTab = routeToTab(path);
      if (matchedTab) {
        if (currentUser.allowedTabs.includes(matchedTab)) {
          if (activeTab !== matchedTab) {
            setActiveTab(matchedTab);
          }
        } else {
          // Akses tidak berwenang - alihkan ke tab yang diizinkan
          const fallbackTab: MainNavTab = currentUser.allowedTabs.includes('dashboard')
            ? 'dashboard'
            : currentUser.allowedTabs[0] || 'pengajuan';
          const fallbackRoute = tabToRoute(fallbackTab);
          pushRoute(fallbackRoute, true);
          setActiveTab(fallbackTab);
          if (onAccessDenied) {
            onAccessDenied(
              `✕ Akses ditolak: Anda tidak memiliki izin mengakses rute ${path}. Dialihkan ke ${fallbackTab}.`
            );
          }
        }
      } else {
        // Rute tidak dikenal - fallback ke dashboard
        const fallbackTab: MainNavTab = currentUser.allowedTabs.includes('dashboard')
          ? 'dashboard'
          : currentUser.allowedTabs[0] || 'pengajuan';
        pushRoute(tabToRoute(fallbackTab), true);
        setActiveTab(fallbackTab);
      }
    };

    // Jalankan pengecekan rute awal saat mount atau user berganti
    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [currentUser, activeTab, setActiveTab, onAccessDenied]);

  return {
    currentPath,
    navigateToTab,
  };
}
