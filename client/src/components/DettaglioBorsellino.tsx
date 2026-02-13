import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
    X, CreditCard, ArrowUpCircle, ArrowDownCircle,
    History, Plus, Minus, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import FormMovimento from './FormMovimento';

interface DettaglioBorsellinoProps {
    giocatore: {
        id: string;
        nome: string;
        cognome: string;
        numeroTessera: string;
    };
    onClose: () => void;
    onUpdate: () => void;
}

const DettaglioBorsellino: React.FC<DettaglioBorsellinoProps> = ({ giocatore, onClose, onUpdate }) => {
    const { token } = useAuth();
    const [saldo, setSaldo] = useState<number | null>(null);
    const [movimenti, setMovimenti] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState<'ricarica' | 'addebito' | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:3001/api/giocatori/${giocatore.id}/borsellino`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSaldo(Number(res.data.saldo));
            setMovimenti(res.data.movimenti);
        } catch (error) {
            console.error('Errore recupero dati borsellino:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [giocatore.id]);

    const handleAction = async (data: { importo: number; tipo: string; descrizione: string }) => {
        setIsActionLoading(true);
        try {
            const endpoint = showForm === 'ricarica' ? 'ricarica' : 'addebito';
            await axios.post(`http://localhost:3001/api/contabilita/${endpoint}`, {
                giocatoreId: giocatore.id,
                ...data
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowForm(null);
            await fetchData();
            onUpdate(); // Notifica la pagina principale del cambiamento
        } catch (error) {
            console.error('Errore durante l\'operazione:', error);
            alert('Errore durante l\'operazione contabile.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const formatValuta = (valore: number | string) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(valore));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl border border-gray-100 flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-dark uppercase tracking-tight">{giocatore.cognome} {giocatore.nome}</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tessera: {giocatore.numeroTessera || 'N/D'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Saldo Attuale */}
                    <div className="text-center bg-gradient-to-br from-dark to-gray-800 p-8 rounded-3xl text-white shadow-xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Saldo Attuale</p>
                        <div className="text-5xl font-black tracking-tighter">
                            {isLoading ? (
                                <Loader2 className="w-10 h-10 animate-spin mx-auto opacity-20" />
                            ) : (
                                <span className={saldo !== null && saldo < 0 ? 'text-red-400' : 'text-green-400'}>
                                    {formatValuta(saldo || 0)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bottoni Azione */}
                    {!showForm && (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowForm('ricarica')}
                                className="flex items-center justify-center gap-3 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                            >
                                <Plus className="w-5 h-5" />
                                Ricarica
                            </button>
                            <button
                                onClick={() => setShowForm('addebito')}
                                className="flex items-center justify-center gap-3 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                            >
                                <Minus className="w-5 h-5" />
                                Addebita
                            </button>
                        </div>
                    )}

                    {/* Form Movimento */}
                    {showForm && (
                        <FormMovimento
                            type={showForm}
                            onClose={() => setShowForm(null)}
                            onSubmit={handleAction}
                            isLoading={isActionLoading}
                        />
                    )}

                    {/* Tabella Movimenti */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <History className="w-4 h-4" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">Ultimi Movimenti</h3>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                            {isLoading ? (
                                <div className="py-20 flex justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-200" />
                                </div>
                            ) : movimenti.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-[9px] font-black uppercase text-gray-400">Data</th>
                                            <th className="px-4 py-3 text-[9px] font-black uppercase text-gray-400">Tipo</th>
                                            <th className="px-4 py-3 text-[9px] font-black uppercase text-gray-400 text-right">Importo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {movimenti.map((m) => {
                                            const isPositive = m.tipo === 'RICARICA';
                                            return (
                                                <tr key={m.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-dark">{format(new Date(m.data), 'dd/MM/yy')}</span>
                                                            <span className="text-[9px] text-gray-400">{format(new Date(m.data), 'HH:mm')}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase tracking-tighter text-gray-600">
                                                                {m.tipo.replace('_', ' ')}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                                                                {m.descrizione || '-'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {isPositive ? (
                                                                <ArrowUpCircle className="w-3 h-3 text-green-500" />
                                                            ) : (
                                                                <ArrowDownCircle className="w-3 h-3 text-red-500" />
                                                            )}
                                                            <span className={`text-xs font-black ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                                                {isPositive ? '+' : '-'}{formatValuta(m.importo)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Nessun movimento</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DettaglioBorsellino;
