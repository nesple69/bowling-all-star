import React, { useState } from 'react';
import { Wallet, Info, Euro, Save, X } from 'lucide-react';

const TransactionForm = ({ transaction, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        descrizione: transaction?.descrizione || '',
        importo: transaction?.importo || '',
        tipo: transaction?.tipo || 'entrate',
        data: transaction?.data || new Date().toISOString().split('T')[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.descrizione || !formData.importo || !formData.tipo || !formData.data) {
            alert('Tutti i campi sono obbligatori');
            return;
        }
        onSave({
            ...formData,
            importo: parseFloat(formData.importo)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-8 rounded-3xl neumorphic-out max-w-2xl mx-auto space-y-6 bg-background">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                <Wallet className="w-6 h-6 text-green-400" />
                {transaction ? 'Modifica Operazione' : 'Nuova Operazione Cassa'}
            </h2>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium ml-4 text-gray-400">Descrizione</label>
                    <div className="relative">
                        <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            required
                            value={formData.descrizione}
                            onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in focus:outline-none"
                            placeholder="Es: Iscrizione Torneo, Materiale..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-4 text-gray-400">Importo (€)</label>
                        <div className="relative">
                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.importo}
                                onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in focus:outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-4 text-gray-400">Tipo</label>
                        <select
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl neumorphic-in focus:outline-none appearance-none bg-background"
                        >
                            <option value="entrate">Entrata (+)</option>
                            <option value="uscite">Uscita (-)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium ml-4 text-gray-400">Data Operazione</label>
                    <input
                        type="date"
                        required
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl neumorphic-in focus:outline-none bg-background"
                    />
                </div>
            </div>

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
                    className="flex-1 py-4 rounded-xl neumorphic-btn bg-green-600/20 text-green-400 font-bold flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" /> Salva Operazione
                </button>
            </div>
        </form>
    );
};

export default TransactionForm;
