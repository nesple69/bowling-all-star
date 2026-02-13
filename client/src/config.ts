// Rilevamento ultra-robusto dell'URL API
const getApiUrl = () => {
    // 1. Priorità assoluta: Variabile d'ambiente esplicita
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 2. Controllo basato sull'URL del browser
    // Se l'utente sta navigando su localhost, usa il backend locale.
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:3001';
    }

    // 3. In produzione (Vercel/Online), usiamo l'Origin corrente (es. https://app.vercel.app)
    // Le chiamate axios(`${API_BASE_URL}/api/...`) diventeranno relative al sito.
    return typeof window !== 'undefined' ? window.location.origin : '';
};

export const API_BASE_URL = getApiUrl();
console.log('🌐 Ambiente:', import.meta.env.MODE);
console.log('📍 Hostname rilevato:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
console.log('🚀 API_BASE_URL finale:', API_BASE_URL || '(Percorso Relativo)');
