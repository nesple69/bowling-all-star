import React, { useState } from 'react';
import { Upload, X, Trophy, Save, List, CheckCircle, AlertCircle, Trash2, Edit2, Globe, Clipboard } from 'lucide-react';

const TournamentImportForm = ({ players, tournaments, onSave, onCancel }) => {
    const [htmlContent, setHtmlContent] = useState('');
    const [importUrl, setImportUrl] = useState('');
    const [importMode, setImportMode] = useState('url'); // 'url' or 'manual'
    const [isFetching, setIsFetching] = useState(false);
    const [step, setStep] = useState(1); // 1: Incolla/URL, 2: Anteprima
    const [parsedResults, setParsedResults] = useState([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState('');
    const [matchesOnly, setMatchesOnly] = useState(true);

    const fetchFromUrl = async () => {
        if (!importUrl.trim()) return;
        try {
            setIsFetching(true);
            // Use AllOrigins proxy to bypass CORS
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(importUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Errore nel caricamento della pagina');
            const data = await response.json();
            setHtmlContent(data.contents);
            // After fetching, try to parse
            parseContent(data.contents);
        } catch (error) {
            alert('Errore nel recupero dati: ' + error.message);
        } finally {
            setIsFetching(false);
        }
    };

    const parseContent = (contentToParse = htmlContent) => {
        if (!contentToParse.trim()) return;

        let results = [];

        // --- 1. PROVA PARSING HTML (LOGICA FISB) ---
        const cleanHtml = contentToParse.replace(/[\t\n\r]/g, ' ').replace(/\s+/g, ' ');
        const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gi;
        let match;

        while ((match = rowRegex.exec(cleanHtml)) !== null) {
            const rowContent = match[1];
            const cellRegex = /<td[^>]*>(.*?)<\/td>/gi;
            const cells = [];
            let cellMatch;
            while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
            }

            if (cells.length >= 5) {
                const pos = parseInt(cells[0]);
                const player = cells[2].toUpperCase();
                const points = parseInt(cells[4]);

                if (!isNaN(pos)) {
                    results.push({ rank: pos, player_name: player, points: isNaN(points) ? 0 : points });
                } else if (cells[0] === '' && player !== '' && !player.includes('GIOCATORE')) {
                    const lastResult = results[results.length - 1];
                    if (lastResult) {
                        results.push({ rank: lastResult.rank, player_name: player, points: lastResult.points });
                    }
                }
            }
        }

        // --- 2. SE HTML FALLISCE O TROVA POCO, PROVA PARSING TESTO SEMPLICE (MOUSE COPY-PASTE) ---
        if (results.length < 2) {
            const lines = contentToParse.split('\n');
            let currentRank = 0;
            let currentPoints = 0;
            const textResults = [];

            lines.forEach(line => {
                // Spesso il copia-incolla usa i tab o multipli spazi
                const parts = line.trim().split(/\t|\s{2,}/);
                if (parts.length >= 3) {
                    const pos = parseInt(parts[0]);
                    // Tipica riga: POS CLUB ATLETA CAT BIRILLI ...
                    // Se POS è numero, cerchiamo l'atleta
                    if (!isNaN(pos)) {
                        currentRank = pos;
                        // Heuristic: Atleta di solito è il 3° elemento se c'è il Club, o il 2° se no
                        let player = (parts[2] || '').toUpperCase();
                        let points = parseInt(parts[4]) || parseInt(parts[3]);

                        if (player && !player.includes('GIOCATORE') && player.length > 3) {
                            textResults.push({ rank: currentRank, player_name: player, points: isNaN(points) ? 0 : points });
                            currentPoints = isNaN(points) ? 0 : points;
                        }
                    } else if (line.trim() !== '' && currentRank > 0) {
                        // Riga senza posizione (membro del trio)
                        // Cerchiamo un nome (puro testo senza numeri)
                        const playerMatch = line.match(/[a-zA-Z\s]{5,}/);
                        if (playerMatch) {
                            const player = playerMatch[0].trim().toUpperCase();
                            if (player && !player.includes('GIOCATORE') && !player.includes('CLICCA')) {
                                textResults.push({ rank: currentRank, player_name: player, points: currentPoints });
                            }
                        }
                    }
                }
            });

            if (textResults.length > results.length) {
                results = textResults;
            }
        }

        if (results.length === 0) {
            alert('Nessun dato trovato. Assicurati di aver incollato il codice HTML o la tabella copiata correttamente.');
            return;
        }

        // Match with registered players
        const matched = results.map(res => {
            const matchedPlayer = players.find(p => {
                const fullName = `${p.nome} ${p.cognome}`.toUpperCase();
                const reversedName = `${p.cognome} ${p.nome}`.toUpperCase();
                return fullName === res.player_name || reversedName === res.player_name;
            });
            return {
                ...res,
                playerId: matchedPlayer?.id || null,
                playerName: matchedPlayer ? `${matchedPlayer.nome} ${matchedPlayer.cognome}` : res.player_name,
                isMatched: !!matchedPlayer
            };
        });

        setParsedResults(matched);
        setStep(2);
    };

    const handleConfirm = () => {
        if (!selectedTournamentId) {
            alert('Seleziona un torneo di destinazione');
            return;
        }

        const finalResults = parsedResults
            .filter(r => r.isMatched)
            .map(r => ({
                id_giocatore: r.playerId,
                id_torneo: selectedTournamentId,
                posizione: r.rank,
                birilli: r.points,
                partite: tournaments.find(t => t.id === selectedTournamentId)?.numero_partite || 6
            }));

        if (finalResults.length === 0) {
            alert('Nessun atleta corrispondente trovato nel sistema.');
            return;
        }

        onSave(finalResults);
    };

    return (
        <div className="p-8 rounded-3xl neumorphic-out max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                <Upload className="w-6 h-6 text-blue-400" />
                Importa Risultati FISB
            </h2>

            {step === 1 ? (
                <div className="space-y-6">
                    {/* Tabs / Mode Selector */}
                    <div className="flex p-1 rounded-2xl neumorphic-in bg-[#1a1a1a]/50">
                        <button
                            onClick={() => setImportMode('url')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${importMode === 'url' ? 'bg-blue-600/20 text-blue-400 shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
                        >
                            <Globe className="w-4 h-4" /> Importa da URL
                        </button>
                        <button
                            onClick={() => setImportMode('manual')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${importMode === 'manual' ? 'bg-blue-600/20 text-blue-400 shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
                        >
                            <Clipboard className="w-4 h-4" /> Incolla Testo/HTML
                        </button>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-400/5 border border-blue-400/10">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            {importMode === 'url'
                                ? 'Inserisci il link alla classifica FISB. Il sistema proverà a scaricare e analizzare i dati automaticamente.'
                                : 'Incolla qui sotto il codice HTML della tabella o semplicemente seleziona le righe della classifica FISB con il mouse e incollale qui.'}
                        </p>
                    </div>

                    {importMode === 'url' ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="url"
                                    value={importUrl}
                                    onChange={(e) => setImportUrl(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl neumorphic-in focus:outline-none text-blue-400"
                                    placeholder="https://www.fisb.it/calendario2.html?view=classifica&id=..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={onCancel} className="flex-1 py-4 rounded-xl neumorphic-btn font-bold text-gray-400">
                                    Annulla
                                </button>
                                <button
                                    onClick={fetchFromUrl}
                                    disabled={!importUrl.trim() || isFetching}
                                    className="flex-1 py-4 rounded-xl neumorphic-btn bg-blue-600/20 text-blue-400 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isFetching ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                            Caricamento...
                                        </>
                                    ) : (
                                        <>Scarica e Analizza</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <textarea
                                value={htmlContent}
                                onChange={(e) => setHtmlContent(e.target.value)}
                                className="w-full h-64 p-4 rounded-xl neumorphic-in focus:outline-none font-mono text-xs text-gray-300"
                                placeholder="Incolla l'HTML o il testo copiato qui..."
                            />
                            <div className="flex gap-4">
                                <button onClick={onCancel} className="flex-1 py-4 rounded-xl neumorphic-btn font-bold text-gray-400">
                                    Annulla
                                </button>
                                <button
                                    onClick={() => parseContent()}
                                    disabled={!htmlContent.trim()}
                                    className="flex-1 py-4 rounded-xl neumorphic-btn bg-blue-600/20 text-blue-400 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Trophy className="w-5 h-5" /> Analizza Dati
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-4 text-gray-400">Torneo di Destinazione</label>
                            <div className="relative">
                                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={selectedTournamentId}
                                    onChange={(e) => setSelectedTournamentId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in focus:outline-none appearance-none"
                                >
                                    <option value="" className="bg-[#1a1a1a]">Seleziona Torneo...</option>
                                    {tournaments.map(t => (
                                        <option key={t.id} value={t.id} className="bg-[#1a1a1a]">{t.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={() => setMatchesOnly(!matchesOnly)}
                            className={`px-4 py-3 rounded-xl neumorphic-btn text-xs font-bold transition-all ${matchesOnly ? 'bg-green-600/20 text-green-400 border border-green-400/20' : 'text-gray-500 border border-transparent'}`}
                        >
                            {matchesOnly ? '✓ Solo Atleti Registrati' : 'Mostra Tutti gli Atleti'}
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-white/5 p-2 space-y-2 bg-black/20 custom-scrollbar">
                        {parsedResults
                            .filter(r => !matchesOnly || r.isMatched)
                            .map((res, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${res.isMatched ? 'bg-green-400/5 hover:bg-green-400/10 border border-green-400/10' : 'bg-red-400/5 opacity-50 border border-red-400/10'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${res.isMatched ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                                            {res.rank}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-200">{res.player_name}</p>
                                            {res.isMatched ? (
                                                <p className="text-[10px] text-green-400 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Registrato come: {res.playerName}
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-red-400 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Atleta non registrato
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-blue-400 leading-none">{res.points}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">birilli</p>
                                    </div>
                                </div>
                            ))}
                        {parsedResults.filter(r => !matchesOnly || r.isMatched).length === 0 && (
                            <div className="py-20 text-center space-y-3 opacity-50">
                                <Search className="w-10 h-10 text-gray-500 mx-auto" />
                                <p className="text-gray-500 italic">Nessun atleta corrispondente trovato.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 rounded-xl bg-blue-400/5 border border-blue-400/10 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-blue-400">Nota sull'importazione:</p>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Verranno importati solo gli atleti evidenziati in verde.
                                Eventuali risultati esistenti per questo torneo verranno sovrascritti dai nuovi dati.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-xl neumorphic-btn font-bold text-gray-400">
                            Indietro
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedTournamentId || parsedResults.filter(r => r.isMatched).length === 0}
                            className="flex-1 py-4 rounded-xl neumorphic-btn bg-green-600/20 text-green-400 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" /> Conferma Importazione ({parsedResults.filter(r => r.isMatched).length})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentImportForm;
