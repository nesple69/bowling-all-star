// Rilevamento intelligente dell'URL API con logging della sorgente
const getApiUrl = () => {
    // 1. Variabile d'ambiente esplicita
    if (import.meta.env.VITE_API_URL) {
        console.log('🔌 API URL sorgente: Variabile d\'ambiente VITE_API_URL');
        return import.meta.env.VITE_API_URL;
    }

    // 2. Controllo ambiente Locale
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.log('🏠 API URL sorgente: Ambiente Locale');
        return 'http://localhost:3001';
    }

    // 3. Produzione (Vercel)
    console.log('🌍 API URL sorgente: Rilevamento automatico Produzione');
    return '';
};

export const API_BASE_URL = getApiUrl();
console.log('🚀 API_BASE_URL configurata:', API_BASE_URL || '(Percorso Relativo)');
