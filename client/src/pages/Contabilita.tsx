import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import {
    Search, User, Loader2, ArrowLeftRight,
    AlertTriangle, ChevronRight, Wallet
} from 'lucide-react';
import DettaglioBorsellino from '../components/DettaglioBorsellino';

// Icona WhatsApp Custom SVG
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.03 0C5.399 0 .007 5.391 0 12.026c0 2.119.554 4.188 1.606 6.01L0 24l6.117-1.605a11.803 11.803 0 005.917 1.6c6.625 0 12.014-5.391 12.018-12.027a11.82 11.82 0 00-3.518-8.508z" />
    </svg>
);

interface SaldoGiocatore {
    id: string;
    nome: string;
    cognome: string;
    numeroTessera: string;
    telefono: string | null;
    saldoAttuale: number;
}

const Contabilita: React.FC = () => {
    const { token } = useAuth();
    const [saldi, setSaldi] = useState<SaldoGiocatore[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGiocatore, setSelectedGiocatore] = useState<SaldoGiocatore | null>(null);

    const fetchSaldi = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/contabilita/saldi`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSaldi(res.data);
        } catch (error) {
            console.error('Errore nel caricamento dei saldi:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchSaldi();
    }, [token]);

    const filteredSaldi = saldi.filter((s: SaldoGiocatore) => {
        const fullSearch = `${s.nome} ${s.cognome} ${s.numeroTessera}`.toLowerCase();
        return fullSearch.includes(searchTerm.toLowerCase());
    });

    const formatValuta = (valore: string | number) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(valore));
    };

    const handleWhatsApp = (e: React.MouseEvent, giocatore: SaldoGiocatore) => {
        e.stopPropagation(); // Evita di aprire la modale
        if (!giocatore.telefono) {
            alert('Numero di telefono non disponibile per questo giocatore.');
            return;
        }

        const telefonoPulito = giocatore.telefono.replace(/\D/g, '');
        const telefonoFormattato = telefonoPulito.startsWith('39') ? telefonoPulito : `39${telefonoPulito}`;

        const messaggio = `Ciao ${giocatore.nome}, il tuo credito è sceso sotto i 15€ ricaricalo per poter continuare la tua attività agonistica.`;
        const url = `https://wa.me/${telefonoFormattato}?text=${encodeURIComponent(messaggio)}`;

        window.open(url, '_blank');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin h-12 w-12 text-primary mb-4" />
                <p className="text-gray-500 font-heading uppercase tracking-widest text-sm">Caricamento contabilità...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 px-4 max-w-7xl mx-auto pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <ArrowLeftRight className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-dark font-heading uppercase tracking-tighter">Gestione Contabilità</h1>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Supervisione Borsellini Giocatori</p>
                    </div>
                </div>

                <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sistema Online</span>
                </div>
            </div>

            {/* Ricerca e Statistiche Rapide */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cerca per nome, cognome o numero tessera..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary focus:ring-0 outline-none transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-dark p-4 rounded-3xl flex items-center justify-between text-white shadow-xl">
                    <div>
                        <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Totale Giocatori</p>
                        <p className="text-2xl font-black">{saldi.length}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl">
                        <User className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Tabella Giocatori */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto border-b border-gray-50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Giocatore</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">N. Tessera</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Saldo Attuale</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Stato</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredSaldi.map((s: SaldoGiocatore) => {
                                const isLowBalance = Number(s.saldoAttuale) < 15;
                                const isCritical = Number(s.saldoAttuale) < 0;
                                return (
                                    <tr
                                        key={s.id}
                                        onClick={() => setSelectedGiocatore(s)}
                                        className="hover:bg-primary/5 transition-all cursor-pointer group"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <p className="text-sm font-black text-dark uppercase">{s.cognome} {s.nome}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-gray-500 tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
                                                {s.numeroTessera || 'N/D'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-lg font-black ${isCritical ? 'text-red-600' : isLowBalance ? 'text-orange-500' : 'text-green-600'}`}>
                                                    {formatValuta(s.saldoAttuale)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-center gap-3">
                                                {isLowBalance && (
                                                    <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse ${isCritical ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-orange-100 text-orange-600'}`}>
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        {isCritical ? 'Saldo Negativo' : 'Ricaricare'}
                                                    </div>
                                                )}
                                                {!isLowBalance && (
                                                    <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border-2 border-green-100">
                                                        Conto in Regola
                                                    </span>
                                                )}

                                                {/* Pulsante WhatsApp per sollecito */}
                                                {isLowBalance && (
                                                    <button
                                                        onClick={(e) => handleWhatsApp(e, s)}
                                                        title="Invia sollecito WhatsApp"
                                                        className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm group/wa"
                                                    >
                                                        <WhatsAppIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredSaldi.length === 0 && (
                    <div className="py-24 text-center text-gray-400">
                        <Wallet className="w-20 h-20 mx-auto opacity-10 mb-6" />
                        <h3 className="text-lg font-black uppercase tracking-widest text-gray-300">Nessun giocatore trovato</h3>
                        <p className="text-sm font-medium opacity-60">Prova a cambiare i filtri di ricerca</p>
                    </div>
                )}
            </div>

            {/* Modal Dettaglio */}
            {selectedGiocatore && (
                <DettaglioBorsellino
                    giocatore={selectedGiocatore}
                    onClose={() => setSelectedGiocatore(null)}
                    onUpdate={fetchSaldi}
                />
            )}
        </div>
    );
};

export default Contabilita;
