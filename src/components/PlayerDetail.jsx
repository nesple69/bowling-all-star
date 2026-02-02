import React from 'react';
import { X, Trophy, Hash, Target, TrendingUp, Calendar, MapPin, FileText, Pencil, ArrowLeft } from 'lucide-react';

const PlayerDetail = ({ player, results, tournaments, onBack, isAdmin, onDeleteResult, onEditResult }) => {
    // Filter results for this player
    const playerResults = results.filter(r => r.id_giocatore === player.id);

    // Link results to tournament info
    const tournamentHistory = playerResults.map(r => {
        const tournament = tournaments.find(t => t.id === r.id_torneo);
        return {
            ...r,
            tournament_name: tournament?.nome || 'Torneo Sconosciuto',
            tournament_sede: tournament?.sede || '-',
            tournament_date: tournament?.data_inizio || r.data,
            tournament_locandina: tournament?.locandina_url,
            media: r.partite > 0 ? (r.birilli / r.partite).toFixed(2) : '0.00'
        };
    }).sort((a, b) => new Date(b.tournament_date) - new Date(a.tournament_date));

    const totalPins = playerResults.reduce((sum, r) => sum + r.birilli, 0);
    const totalGames = playerResults.reduce((sum, r) => sum + r.partite, 0);
    const overallMedia = totalGames > 0 ? (totalPins / totalGames).toFixed(2) : '0.00';

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center gap-2 p-3 rounded-xl neumorphic-btn text-gray-400">
                    <ArrowLeft className="w-5 h-5" /> Indietro
                </button>
                <h2 className="text-2xl font-bold text-blue-400">{player.nome} {player.cognome}</h2>
            </div>

            {/* Stats Summary Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl neumorphic-out text-center space-y-2 border border-blue-400/10">
                    <TrendingUp className="w-6 h-6 mx-auto text-blue-400" />
                    <p className="text-gray-400 uppercase text-xs tracking-widest">Media Totale</p>
                    <p className="text-4xl font-black text-blue-400">{overallMedia}</p>
                </div>
                <div className="p-6 rounded-3xl neumorphic-out text-center space-y-2 border border-purple-400/10">
                    <Target className="w-6 h-6 mx-auto text-purple-400" />
                    <p className="text-gray-400 uppercase text-xs tracking-widest">Totale Birilli</p>
                    <p className="text-4xl font-black text-purple-400">{totalPins}</p>
                </div>
                <div className="p-6 rounded-3xl neumorphic-out text-center space-y-2 border border-yellow-400/10">
                    <Hash className="w-6 h-6 mx-auto text-yellow-500" />
                    <p className="text-gray-400 uppercase text-xs tracking-widest">Totale Partite</p>
                    <p className="text-4xl font-black text-yellow-500">{totalGames}</p>
                </div>
            </div>

            {/* Tournament History Table */}
            <div className="p-8 rounded-3xl neumorphic-out">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" /> Storico Tornei
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/5">
                                <th className="pb-4 pl-4 font-medium uppercase text-xs">Data</th>
                                <th className="pb-4 font-medium uppercase text-xs">Torneo / Sede</th>
                                <th className="pb-4 font-medium uppercase text-xs text-center">Partite</th>
                                <th className="pb-4 font-medium uppercase text-xs text-center">Birilli</th>
                                <th className="pb-4 font-medium uppercase text-xs text-center">Media</th>
                                {isAdmin && <th className="pb-4 pr-4"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tournamentHistory.map((h) => (
                                <tr key={h.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 pl-4 text-sm text-gray-400">
                                        {new Date(h.tournament_date).toLocaleDateString('it-IT')}
                                    </td>
                                    <td className="py-4">
                                        <div className="font-bold">{h.tournament_name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {h.tournament_sede}
                                            {h.tournament_locandina && (
                                                <a href={h.tournament_locandina} target="_blank" rel="noreferrer" className="ml-2 text-blue-400 hover:underline flex items-center gap-0.5">
                                                    <FileText className="w-3 h-3" /> Locandina
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 text-center font-mono">{h.partite}</td>
                                    <td className="py-4 text-center font-mono">{h.birilli}</td>
                                    <td className="py-4 text-center font-black text-blue-400">{h.media}</td>
                                    {isAdmin && (
                                        <td className="py-4 pr-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => onEditResult(h)}
                                                    className="p-2 rounded-lg neumorphic-btn text-blue-400 hover:scale-110 transition-transform"
                                                    title="Modifica Punteggio"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteResult(h.id)}
                                                    className="p-2 rounded-lg neumorphic-btn text-red-500 hover:scale-110 transition-transform"
                                                    title="Elimina Punteggio"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {tournamentHistory.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-gray-500 italic">
                                        Nessun torneo registrato per questo atleta.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PlayerDetail;
