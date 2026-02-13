import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    Trophy, ChevronLeft, Save, Trash2,
    Plus, Search, UserPlus, Info,
    CheckCircle2, AlertCircle
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

interface Giocatore {
    id: string;
    nome: string;
    cognome: string;
    categoria: string;
}

interface Risultato {
    id?: string;
    giocatoreId: string;
    posizione: number;
    partiteGiocate: number;
    totaleBirilli: number;
    totaleBirilliSquadra?: number;
    isRiserva: boolean;
    giocatore: {
        nome: string;
        cognome: string;
        categoria: string;
    };
}

const InserimentoRisultati: React.FC = () => {
    const { id } = useParams();
    const [torneo, setTorneo] = useState<any>(null);
    const [risultati, setRisultati] = useState<Risultato[]>([]);
    const [giocatori, setGiocatori] = useState<Giocatore[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            const token = sessionStorage.getItem('token');
            try {
                const [resTorneo, resRisultati, resGiocatori] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/tornei/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE_URL}/api/tornei/${id}/risultati`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE_URL}/api/giocatori`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setTorneo(resTorneo.data);
                setRisultati(resRisultati.data);
                setGiocatori(resGiocatori.data);
            } catch (err) {
                console.error('Errore nel caricamento dei dati:', err);
                setStatus({ type: 'error', message: 'Impossibile caricare i dati del torneo.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSaveResult = async (risultato: Risultato) => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/tornei/${id}/risultati`, risultato, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update the ID if it was new
            setRisultati(risultati.map(r => r.giocatoreId === risultato.giocatoreId ? { ...r, id: res.data.id } : r));
            setStatus({ type: 'success', message: 'Risultato salvato!' });
            setTimeout(() => setStatus({ type: null, message: '' }), 2000);
        } catch (err) {
            setStatus({ type: 'error', message: 'Errore nel salvataggio.' });
        }
    };

    const handleDeleteResult = async (risultatoId: string) => {
        if (!window.confirm('Eliminare questo risultato?')) return;
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/tornei/${id}/risultati/${risultatoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRisultati(risultati.filter(r => r.id !== risultatoId));
        } catch (err) {
            alert('Errore nell\'eliminazione.');
        }
    };

    const addGiocatoreToResults = (g: Giocatore) => {
        if (risultati.some(r => r.giocatoreId === g.id)) {
            alert('Questo giocatore è già in classifica.');
            return;
        }

        const nuovoRisultato: Risultato = {
            giocatoreId: g.id,
            posizione: risultati.length + 1,
            partiteGiocate: 6,
            totaleBirilli: 0,
            isRiserva: false,
            giocatore: {
                nome: g.nome,
                cognome: g.cognome,
                categoria: g.categoria
            }
        };

        setRisultati([...risultati, nuovoRisultato]);
        setSearchQuery('');
    };

    const updateLocalResultField = (giocatoreId: string, field: keyof Risultato, value: any) => {
        setRisultati(risultati.map(r => r.giocatoreId === giocatoreId ? { ...r, [field]: value } : r));
    };

    const filteredGiocatori = giocatori.filter(g =>
        `${g.nome} ${g.cognome}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.id.includes(searchQuery)
    ).slice(0, 5);

    if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 text-dark">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin/tornei" className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:text-primary transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Trophy className="text-secondary w-7 h-7" />
                            Classifiche: {torneo?.nome}
                        </h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Inserimento Scorecard Ufficiali</p>
                    </div>
                </div>
                {status.type && (
                    <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 animate-slide-up ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span className="text-xs font-black uppercase tracking-wider">{status.message}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Search */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Aggiungi Atleta
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                            <input
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary outline-none text-sm font-bold transition-all"
                                placeholder="Cerca cognome..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {searchQuery && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                {filteredGiocatori.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => addGiocatoreToResults(g)}
                                        className="w-full p-3 text-left hover:bg-primary/5 rounded-xl transition-colors group flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-xs font-black text-dark uppercase">{g.cognome} {g.nome}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{g.categoria}</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-gray-200 group-hover:text-primary" />
                                    </button>
                                ))}
                                {filteredGiocatori.length === 0 && (
                                    <p className="text-[10px] text-center text-gray-300 py-3 uppercase font-black">Nessun match</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-secondary/5 p-6 rounded-3xl border border-secondary/10 flex gap-4">
                        <Info className="text-secondary w-6 h-6 shrink-0" />
                        <div>
                            <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-1">Nota Team / Gruppo</h4>
                            <p className="text-sm text-secondary/70 font-bold leading-relaxed uppercase">
                                Per tornei non singoli, inserisci il totale della squadra o del gruppo di fianco a ogni giocatore.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scorecard Table */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Pos</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Atleta</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Partite</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Birilli Tot.</th>
                                    {torneo?.tipologia !== 'SINGOLO' && (
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest text-secondary">Tot. Squadra</th>
                                    )}
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Riserva</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {risultati.length > 0 ? risultati.map((r) => (
                                    <tr key={r.giocatoreId} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                className="w-12 px-2 py-1 bg-transparent border-b border-transparent focus:border-primary outline-none font-black text-dark text-sm"
                                                value={r.posizione}
                                                onChange={e => updateLocalResultField(r.giocatoreId, 'posizione', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm uppercase text-dark">{r.giocatore.cognome} {r.giocatore.nome}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{r.giocatore.categoria}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <input
                                                    type="number"
                                                    className="w-12 text-center px-1 py-1 bg-transparent border-b border-transparent focus:border-primary outline-none font-bold text-sm"
                                                    value={r.partiteGiocate}
                                                    onChange={e => updateLocalResultField(r.giocatoreId, 'partiteGiocate', e.target.value)}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const pStr = window.prompt("Inserisci i punteggi delle partite separati da virgola (es: 180, 210, 195):", (r as any).partite?.join(', ') || "");
                                                        if (pStr !== null) {
                                                            const pArr = pStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                                                            updateLocalResultField(r.giocatoreId, 'partite' as any, pArr);
                                                        }
                                                    }}
                                                    className="text-[9px] font-black uppercase text-secondary hover:underline"
                                                >
                                                    {(r as any).partite?.length ? `${(r as any).partite.length} Partite` : "Incl. Partite"}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="number"
                                                className="w-20 text-center px-1 py-1 bg-gray-50 border-b border-transparent focus:border-primary outline-none font-black text-sm rounded-lg"
                                                value={r.totaleBirilli}
                                                onChange={e => updateLocalResultField(r.giocatoreId, 'totaleBirilli', e.target.value)}
                                            />
                                        </td>
                                        {/* ... (rest of the row) ... */}
                                        {torneo?.tipologia !== 'SINGOLO' && (
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    className="w-20 text-center px-1 py-1 bg-secondary/5 text-secondary border-b border-transparent focus:border-secondary outline-none font-black text-sm rounded-lg"
                                                    value={r.totaleBirilliSquadra || ''}
                                                    onChange={e => updateLocalResultField(r.giocatoreId, 'totaleBirilliSquadra', e.target.value)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={r.isRiserva}
                                                onChange={e => updateLocalResultField(r.giocatoreId, 'isRiserva', e.target.checked)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleSaveResult(r)}
                                                    className="p-2 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all"
                                                    title="Salva riga"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                {r.id && (
                                                    <button
                                                        onClick={() => handleDeleteResult(r.id!)}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Rimuovi"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <Trophy className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                                            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Nessun risultato inserito</p>
                                            <p className="text-[10px] text-gray-200 uppercase font-bold mt-1">Usa la sidebar per aggiungere atleti alla classifica</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {risultati.length > 0 && (
                        <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">
                            {risultati.length} atleti in classifica • Ricordati di salvare ogni riga modificata.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InserimentoRisultati;
