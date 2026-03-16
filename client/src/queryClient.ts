import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // I dati sono considerati "freschi" per 5 minuti
            gcTime: 1000 * 60 * 30, // I dati inutilizzati vengono tenuti in memoria per 30 minuti
            refetchOnWindowFocus: false, // Disabilita il refetch automatico al focus della finestra per evitare richieste inutili
            retry: 1, // Riprova in caso di errore (1 volta oltre a quella iniziale)
        },
    },
});
