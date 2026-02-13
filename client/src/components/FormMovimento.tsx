import React, { useState } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';

interface FormMovimentoProps {
    onClose: () => void;
    onSubmit: (data: { importo: number; tipo: string; descrizione: string }) => Promise<void>;
    type: 'ricarica' | 'addebito';
    isLoading: boolean;
}

const FormMovimento: React.FC<FormMovimentoProps> = ({ onClose, onSubmit, type, isLoading }) => {
    const [importo, setImporto] = useState('');
    const [descrizione, setDescrizione] = useState('');
    const [tipoMovimento, setTipoMovimento] = useState(type === 'ricarica' ? 'RICARICA' : 'ADDEBITO_MANUALE');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importo || parseFloat(importo) <= 0) {
            alert('Inserisci un importo valido.');
            return;
        }
        await onSubmit({
            importo: parseFloat(importo),
            tipo: tipoMovimento,
            descrizione: descrizione
        });
    };

    return (
        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-primary/10 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-dark flex items-center gap-2">
                    {type === 'ricarica' ? (
                        <><Plus className="w-4 h-4 text-green-600" /> Nuova Ricarica</>
                    ) : (
                        <><Minus className="w-4 h-4 text-red-600" /> Nuovo Addebito Manuale</>
                    )}
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Importo (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-0 outline-none transition-all font-bold text-lg"
                        value={importo}
                        onChange={(e) => setImporto(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tipo Movimento</label>
                    <select
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-0 outline-none transition-all font-bold text-sm"
                        value={tipoMovimento}
                        onChange={(e) => setTipoMovimento(e.target.value)}
                    >
                        {type === 'ricarica' ? (
                            <option value="RICARICA">Ricarica Credito</option>
                        ) : (
                            <>
                                <option value="ADDEBITO_MANUALE">Addebito Manuale</option>
                                <option value="ISCRIZIONE_TORNEO">Iscrizione Torneo</option>
                                <option value="ACQUISTO_MAGLIA">Acquisto Maglia/Materiale</option>
                            </>
                        )}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Descrizione / Note</label>
                    <textarea
                        placeholder="Inserisci una causale..."
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-0 outline-none transition-all font-medium text-sm min-h-[100px] resize-none"
                        value={descrizione}
                        onChange={(e) => setDescrizione(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-dark text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary transition-all shadow-lg shadow-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Elaborazione...
                        </>
                    ) : (
                        'Conferma Operazione'
                    )}
                </button>
            </form>
        </div>
    );
};

export default FormMovimento;
