import { useEffect, useMemo, useState } from 'react';
import { demoProducts } from '../data/demo.js';
import { clearStoredAdminSession } from './adminSession.js';
import { resolveApiBaseUrl } from './api.js';

function resolveCatalogUnavailableMessage(payload) {
  if (payload?.databaseReady === false) {
    return payload?.databaseErrorMessage || 'Live catalog is unavailable because the API is running without MongoDB.';
  }

  return 'Unable to load live catalog products right now.';
}

function filterProducts(products, businessType, search = '') {
  const filteredByType = products.filter((product) => product.businessTypes.includes(businessType));
  const normalizedSearch = String(search || '').trim().toLowerCase();

  if (!normalizedSearch) {
    return filteredByType;
  }

  return filteredByType.filter((product) => {
    return [
      product.brand?.en,
      product.brand?.ar,
      product.name?.en,
      product.name?.ar,
      product.category?.en,
      product.category?.ar,
      product.sku,
      product.barcode,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

function buildCatalogUrl({ businessType, tenantId, search }) {
  const params = new URLSearchParams();

  if (businessType) {
    params.set('businessType', businessType);
  }

  if (tenantId) {
    params.set('tenantId', tenantId);
  }

  if (search) {
    params.set('search', search);
  }

  return `${resolveApiBaseUrl()}/api/products?${params.toString()}`;
}

export function useCatalogProducts({ businessType, session = null, search = '', reloadKey = 0, allowDemoFallback = true }) {
  const fallbackProducts = useMemo(() => filterProducts(demoProducts, businessType, search), [businessType, search]);
  const [products, setProducts] = useState(fallbackProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [source, setSource] = useState('demo');
  const tenantId = String(session?.user?.tenantId || '').trim();
  const token = String(session?.token || '').trim();

  useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch(buildCatalogUrl({ businessType, tenantId, search }), {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });
        const payload = await response.json();

        if (!response.ok) {
          if (response.status === 401 && token) {
            clearStoredAdminSession();
          }

          throw new Error(payload.message || 'Unable to load catalog products right now.');
        }

        if (isCancelled) {
          return;
        }

        const resolvedProducts = Array.isArray(payload.products) ? payload.products : [];
        const resolvedSource = payload.source || 'api';
        const shouldSuppressDemoFallback = !allowDemoFallback && resolvedSource !== 'database';

        setProducts(shouldSuppressDemoFallback ? [] : resolvedProducts);
        setErrorMessage(shouldSuppressDemoFallback ? resolveCatalogUnavailableMessage(payload) : '');
        setSource(resolvedSource);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setProducts(allowDemoFallback ? fallbackProducts : []);
        setSource(allowDemoFallback ? 'demo' : 'unavailable');
        setErrorMessage(error.message || 'Unable to load live catalog right now.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [allowDemoFallback, businessType, fallbackProducts, reloadKey, search, tenantId, token]);

  return {
    products,
    isLoading,
    errorMessage,
    source,
  };
}
