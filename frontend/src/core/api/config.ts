/**
 * Configuración centralizada de la URL base para el cliente de API.
 * 
 * Resuelve dinámicamente:
 * 1. `import.meta.env.VITE_API_URL` si está definida.
 * 2. Fallback a `/api/v1` para despliegues con reverse proxy o dominio remoto.
 * 3. Fallback a `http://localhost:3000/api/v1` para desarrollo local estándar.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }

  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return '/api/v1';
  }

  return 'http://localhost:3000/api/v1';
};

export const API_BASE_URL: string = getApiBaseUrl();
