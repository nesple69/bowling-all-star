// Rilevamento automatico dell'URL API
const getApiUrl = () => {
    // 1. Se è definita la variabile explicitamente (es. Vercel Settings)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 2. Se siamo in sviluppo (npm run dev)
    if (import.meta.env.DEV) return 'http://localhost:3001';

    // 3. In produzione (Vercel), usiamo percorsi relativi (/api/...) 
    // perché vercel.json gestisce il routing interno.
    return '';
};

export const API_BASE_URL = getApiUrl();
console.log('🌐 API_BASE_URL configurato:', API_BASE_URL || '(Percorso Relativo)');
