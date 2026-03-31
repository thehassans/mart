import { useCallback, useEffect, useState } from 'react';
import { USER_ROLES } from '@vitalblaze/shared';

const ADMIN_SESSION_STORAGE_KEY = 'buysial-admin-session';
const ADMIN_SESSION_EVENT = 'buysial-admin-session-updated';

export function getPanelPathForRole(role) {
  return role === USER_ROLES.SUPER_ADMIN ? '/admin/panel/tenants' : '/admin/panel';
}

export function readStoredAdminSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function persistAdminSession(session) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT, { detail: session }));
}

export function clearStoredAdminSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT, { detail: null }));
}

export function useAdminSession() {
  const [session, setSession] = useState(() => readStoredAdminSession());

  useEffect(() => {
    function handleStorage(event) {
      if (event.key && event.key !== ADMIN_SESSION_STORAGE_KEY) {
        return;
      }

      setSession(readStoredAdminSession());
    }

    function handleCustomEvent(event) {
      setSession(event.detail || null);
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener(ADMIN_SESSION_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(ADMIN_SESSION_EVENT, handleCustomEvent);
    };
  }, []);

  const saveSession = useCallback((nextSession) => {
    persistAdminSession(nextSession);
    setSession(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    clearStoredAdminSession();
    setSession(null);
  }, []);

  return {
    session,
    saveSession,
    clearSession,
  };
}
