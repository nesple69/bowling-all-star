import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export function usePartiteTorneo(risultatoTorneoId: string | null) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!risultatoTorneoId) {
            setData(null);
            return;
        }

        const fetchPartite = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/partite/torneo/${risultatoTorneoId}`);
                setData(response.data.data);
            } catch (err: any) {
                console.error('Errore fetch partite:', err);
                setError(err.response?.data?.message || err.message || 'Errore durante il caricamento delle partite');
            } finally {
                setLoading(false);
            }
        };

        fetchPartite();
    }, [risultatoTorneoId]);

    return { data, loading, error };
}
