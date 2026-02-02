import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Target, Hash, Save, X, Trophy, User } from 'lucide-react';

const ResultForm = ({ players, tournaments, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        id_giocatore: '',
        id_torneo: '',
        birilli: '',
        partite: ''
    });

    // Automatically update the number of games when a tournament is selected
    useEffect(() => {
        if (formData.id_torneo) {
            const tournament = tournaments.find(t => t.id === formData.id_torneo);
            if (tournament) {
                setFormData(prev => ({ ...prev, partite: tournament.numero_partite }));
            }
        }
    }, [formData.id_torneo, tournaments]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.id_giocatore || !formData.id_torneo || !formData.birilli || !formData.partite) {
            alert('Tutti i campi sono obbligatori');
            return;
        }
        onSave({
            ...formData,
            birilli: parseInt(formData.birilli),
            partite: parseInt(formData.partite),
            data: new Date().toISOString()
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-8 rounded-3xl neumorphic-out max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-purple-400" />
                Inserisci Risultato Torneo
            </h2>

            {/* Selezione Giocatore */}
            <div className="space-y-2">
                <label className="text-sm font-medium ml-4 text-gray-400">Atleta</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        required
                        value={formData.id_giocatore}
                        onChange={(e) => setFormData({ ...formData, id_giocatore: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in focus:outline-none appearance-none"
                    >
                        <option value="" className="bg-[#1a1a1a]">Seleziona Atleta...</option>
                        {players.map(p => (
                            <option key={p.id} value={p.id} className="bg-[#1a1a1a]">{p.nome} {p.cognome}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Selezione Torneo */}
            <div className="space-y-2">
                <label className="text-sm font-medium ml-4 text-gray-400">Torneo</label>
                <div className="relative">
                    <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        required
                        value={formData.id_torneo}
                        onChange={(e) => setFormData({ ...formData, id_torneo: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in focus:outline-none appearance-none"
                    >
                        <option value="" className="bg-[#1a1a1a]">Seleziona Torneo...</option>
                        {tournaments.map(t => (
                            <option key={t.id} value={t.id} className="bg-[#1a1a1a]">{t.nome} ({t.sede})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Numero Birilli */}
                <div className="space-y-2">
                    <label className="text-sm font-medium ml-4 text-gray-400">Totale Birilli</label>
                    <div className="relative">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="number"
                            required
                            min="0"
                            value={formData.birilli}
                            onChange={(e) => setFormData({ ...formData, birilli: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in focus:outline-none"
                            placeholder="Esempio: 1250"
                        />
                    </div>
                </div>

                {/* Numero Partite (Precompilato dal torneo) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium ml-4 text-gray-400">Numero Partite</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="number"
                            required
                            readOnly
                            value={formData.partite}
                            className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in opacity-70 cursor-not-allowed outline-none"
                            placeholder="Seleziona un torneo..."
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 ml-4 italic">* Numero partite preimpostato dal torneo selezionato</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 rounded-xl neumorphic-btn font-bold flex items-center justify-center gap-2"
                >
                    <X className="w-5 h-5" /> Annulla
                </button>
                <button
                    type="submit"
                    className="flex-1 py-4 rounded-xl neumorphic-btn bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" /> Salva Risultato
                </button>
            </div>
        </form>
    );
};

export default ResultForm;
