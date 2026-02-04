import React from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const CleanZeroResultsButton = ({ onComplete }) => {
    const handleClean = async () => {
        if (!window.confirm('Eliminare tutti i risultati con 0 birilli? Questa operazione non può essere annullata.')) return;

        try {
            const { data: toDelete, error: fetchError } = await supabase
                .from('results')
                .select('*')
                .eq('birilli', 0);

            if (fetchError) {
                alert('Errore nel recupero dei risultati: ' + fetchError.message);
                return;
            }

            if (toDelete.length === 0) {
                alert('Nessun risultato con 0 birilli trovato.');
                return;
            }

            const { error: deleteError } = await supabase
                .from('results')
                .delete()
                .eq('birilli', 0);

            if (deleteError) {
                alert('Errore nell\'eliminazione: ' + deleteError.message);
            } else {
                alert(`✅ Eliminati ${toDelete.length} risultati con 0 birilli!`);
                if (onComplete) onComplete();
            }
        } catch (error) {
            alert('Errore: ' + error.message);
        }
    };

    return (
        <button
            onClick={handleClean}
            className="px-4 py-2 rounded-xl neumorphic-btn bg-red-600/20 text-red-400 font-bold text-sm flex items-center gap-2 hover:bg-red-600/30 transition-colors"
        >
            <Trash2 className="w-4 h-4" />
            Pulisci Risultati Vuoti
        </button>
    );
};

export default CleanZeroResultsButton;
