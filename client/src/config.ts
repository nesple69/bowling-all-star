// Rilevamento intelligente dell'URL API
const getApiUrl = () => {
    // 1. Priorità assoluta: Variabile d'ambiente esplicita (se impostata su Vercel)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 2. Controllo ambiente Locale (Sviluppo)
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:3001';
    }

    // 3. Produzione (Vercel)
    // Usiamo una stringa vuota. Le chiamate axios(`${API_BASE_URL}/api/...`) 
    // diventeranno percorsi relativi (/api/...) che Vercel instrada correttamente.
    return '';
};

export const API_BASE_URL = getApiUrl();
console.log('🌐 Ambiente:', import.meta.env.MODE);
console.log('🚀 API_BASE_URL configurata:', API_BASE_URL || '(Percorso Relativo)');
