import React from 'react';
import { X, Trophy, Target, Loader2, AlertCircle } from 'lucide-react';
import { usePartiteTorneo } from '../hooks/usePartiteTorneo';
import CardPartita from './CardPartita';

interface Props {
    risultatoTorneoId: string | null;
    onClose: () => void;
}

const ModalPartiteTorneo: React.FC<Props> = ({ risultatoTorneoId, onClose }) => {
    const { data: details, loading, error } = usePartiteTorneo(risultatoTorneoId);

    if (!risultatoTorneoId) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border-2 border-[#F8B500] flex flex-col relative transform transition-all animate-scale-in">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#5DADE2] to-[#3498DB] p-6 text-white flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                {loading ? 'Caricamento...' : `Partite - ${details?.torneo?.nome || 'Dettaglio'}`}
                            </h2>
                            {!loading && details && (
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                    {details.giocatore.nome} • {details.torneo.tipologia}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors group"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                            <Loader2 className="w-12 h-12 text-[#5DADE2] animate-spin mb-4" />
                            <p className="font-black uppercase text-xs tracking-widest text-gray-400">Recupero partite in corso...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl flex items-center gap-4">
                            <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />
                            <div>
                                <h4 className="font-black uppercase text-red-800 text-sm">Errore</h4>
                                <p className="text-red-700 text-xs font-medium">{error}</p>
                            </div>
                        </div>
                    ) : details ? (
                        <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="text-center">
                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Posizione Finale</p>
                                    <p className="text-2xl font-black text-dark">{details.risultatoComplessivo.posizione}°</p>
                                </div>
                                <div className="text-center border-l border-gray-200">
                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Totale Birilli</p>
                                    <p className="text-2xl font-black text-[#5DADE2]">{details.risultatoComplessivo.totaleBirilli}</p>
                                </div>
                            </div>

                            {/* Games List */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b-2 border-gray-100 pb-2">
                                    <Target className="w-4 h-4 text-[#F8B500]" />
                                    <h3 className="font-black uppercase text-xs tracking-widest text-[#2C3E50]">Progresso Partite</h3>
                                </div>

                                {details.partite.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {details.partite.map((p: any) => (
                                            <CardPartita
                                                key={p.numeroPartita}
                                                numeroPartita={p.numeroPartita}
                                                birilli={p.birilli}
                                                data={p.data}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-tighter">Nessun dettaglio partita disponibile per questo torneo.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="bg-[#F8B500] hover:bg-[#E5A600] text-white font-black uppercase text-xs tracking-widest px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalPartiteTorneo;
