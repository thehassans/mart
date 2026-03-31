import { useCallback, useEffect, useState } from 'react';
import { defaultSiteContent } from '../data/siteContent.js';

const SITE_CONTENT_STORAGE_KEY = 'buysial-site-content';
const SITE_CONTENT_EVENT = 'buysial-site-content-updated';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeContent(baseValue, overrideValue) {
  if (Array.isArray(baseValue)) {
    return Array.isArray(overrideValue) ? overrideValue : baseValue;
  }

  if (isObject(baseValue)) {
    const keys = new Set([...Object.keys(baseValue), ...Object.keys(overrideValue || {})]);

    return [...keys].reduce((result, key) => {
      result[key] = mergeContent(baseValue[key], overrideValue?.[key]);
      return result;
    }, {});
  }

  return overrideValue ?? baseValue;
}

export function buildSiteContentSnapshot(content = defaultSiteContent) {
  return mergeContent(defaultSiteContent, content);
}

export function resolveLocalizedValue(value, language) {
  if (isObject(value) && ('en' in value || 'ar' in value)) {
    return value[language] || value.en || value.ar || '';
  }

  return value ?? '';
}

export function readStoredSiteContent() {
  if (typeof window === 'undefined') {
    return defaultSiteContent;
  }

  try {
    const rawValue = window.localStorage.getItem(SITE_CONTENT_STORAGE_KEY);

    if (!rawValue) {
      return defaultSiteContent;
    }

    return buildSiteContentSnapshot(JSON.parse(rawValue));
  } catch {
    return defaultSiteContent;
  }
}

export function persistSiteContent(nextContent) {
  if (typeof window === 'undefined') {
    return;
  }

  const snapshot = buildSiteContentSnapshot(nextContent);
  window.localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent(SITE_CONTENT_EVENT, { detail: snapshot }));
}

export function resetStoredSiteContent() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SITE_CONTENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SITE_CONTENT_EVENT, { detail: defaultSiteContent }));
}

export function useSiteContent() {
  const [siteContent, setSiteContent] = useState(() => readStoredSiteContent());

  useEffect(() => {
    function handleStorage(event) {
      if (event.key && event.key !== SITE_CONTENT_STORAGE_KEY) {
        return;
      }

      setSiteContent(readStoredSiteContent());
    }

    function handleCustomEvent(event) {
      setSiteContent(buildSiteContentSnapshot(event.detail));
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SITE_CONTENT_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SITE_CONTENT_EVENT, handleCustomEvent);
    };
  }, []);

  const saveSiteContent = useCallback((nextContent) => {
    const resolvedContent = typeof nextContent === 'function' ? nextContent(readStoredSiteContent()) : nextContent;
    const snapshot = buildSiteContentSnapshot(resolvedContent);

    persistSiteContent(snapshot);
    setSiteContent(snapshot);
  }, []);

  const resetSiteContent = useCallback(() => {
    resetStoredSiteContent();
    setSiteContent(defaultSiteContent);
  }, []);

  return {
    siteContent,
    saveSiteContent,
    resetSiteContent,
  };
}
