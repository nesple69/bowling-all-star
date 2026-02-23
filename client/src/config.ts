// Rilevamento URL API - Versione Definitiva "No-Bug"
const getApiUrl = () => {
    // 1. Controllo se siamo in ambiente locale (PC di sviluppo)
    const isLocal = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal) {
        console.log('🏠 Ambiente: Locale (Sviluppo)');
        return 'http://localhost:3001';
    }

    // 2. Produzione (Vercel / Online)
    // Ignoriamo deliberatamente VITE_API_URL per evitare errori di battitura persistenti.
    // Usare '' (vuoto) forza il browser a usare l'indirizzo attuale del sito per le chiamate API.
    console.log('🌍 Ambiente: Produzione (Online)');
    return '';
};

export const API_BASE_URL = getApiUrl();
console.log('🚀 API_BASE_URL finale:', API_BASE_URL || '(Percorso Relativo)');

// Debug log per identificare variabili "fantasma"
if (import.meta.env.VITE_API_URL) {
    console.warn('⚠️ Nota: C\'è ancora una variabile VITE_API_URL impostata:', import.meta.env.VITE_API_URL);
}
