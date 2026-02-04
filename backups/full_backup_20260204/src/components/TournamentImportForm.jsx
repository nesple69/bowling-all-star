import React, { useState } from 'react';
import { Upload, X, Trophy, Save, List, CheckCircle, AlertCircle, Trash2, Edit2, Globe, Clipboard } from 'lucide-react';
import { supabase } from '../supabaseClient';

const TournamentImportForm = ({ players, tournaments, onSave, onCancel }) => {
    const [htmlContent, setHtmlContent] = useState('');
    const [importUrl, setImportUrl] = useState('');
    const [importMode, setImportMode] = useState('url');
    const [isFetching, setIsFetching] = useState(false);
    const [step, setStep] = useState(1);
    const [parsedResults, setParsedResults] = useState([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState('');
    const [matchesOnly, setMatchesOnly] = useState(true);

    const fetchFromUrl = async () => {
        if (!importUrl.trim()) return;
        setIsFetching(true);

        // Lista di proxy da provare in ordine
        const proxies = [
            (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];

        let lastError = null;

        for (const getProxyUrl of proxies) {
            try {
                console.log(`Trying proxy: ${getProxyUrl(importUrl)}`);
                const response = await fetch(getProxyUrl(importUrl));
                if (!response.ok) throw new Error(`Status ${response.status}`);

                const data = await response.json();
                // AllOrigins mette il contenuto in .contents, altri proxy potrebbero restituire il testo direttamente
                const content = data.contents || data;

                if (content && typeof content === 'string' && content.length > 100) {
                    setHtmlContent(content);
                    parseContent(content);
                    setIsFetching(false);
                    return; // Successo!
                }
            } catch (error) {
                console.warn(`Proxy failed:`, error);
                lastError = error;
            }
        }

        setIsFetching(false);
        alert(`Errore nel recupero dati: Non è stato possibile scaricare la pagina via proxy.\n\nSuggerimento: Apri il link nel browser, seleziona la tabella con il mouse, copiala e incollala qui usando la modalità "Incolla Testo/HTML".`);
    };

    const parseContent = (contentToParse = htmlContent) => {
        if (!contentToParse.trim()) return;

        let results = [];
        console.log('=== FISB Parser Start ===');

        // Helper per pulire il testo
        const cleanStr = (s) => (s || '')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&[a-z]+;/g, '')
            .replace(/[\t\n\r]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // 1. ESTRAZIONE RIGHE (HTML o TESTO)
        let rows = [];
        if (contentToParse.includes('<tr')) {
            const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gi;
            let match;
            while ((match = rowRegex.exec(contentToParse)) !== null) {
                const cellRegex = /<td[^>]*>(.*?)<\/td>|<th[^>]*>(.*?)<\/th>/gi;
                const cells = [];
                let cellMatch;
                while ((cellMatch = cellRegex.exec(match[1])) !== null) {
                    cells.push(cleanStr(cellMatch[1] || cellMatch[2]));
                }
                if (cells.length > 0) rows.push(cells);
            }
        } else {
            rows = contentToParse.split('\n')
                .map(line => line.split(/\t|\s{2,}/).map(cleanStr).filter(c => c.length > 0))
                .filter(r => r.length > 0);
        }

        if (rows.length === 0) {
            alert('Nessun dato trovato. Assicurati di aver copiato correttamente la tabella.');
            return;
        }

        // 2. RILEVAMENTO INTESTAZIONI (Heuristic)
        let colMapping = { rank: -1, name: -1, scores: [], total: -1, media: -1, teamTotal: -1 };

        // Cerchiamo la riga d'intestazione nei primi record
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i];
            let nameMatched = false;
            row.forEach((cell, idx) => {
                const c = cell.toUpperCase().trim();
                if (['POS', 'RANGO', 'POS.', '#', 'POSIZIONE', 'CL'].includes(c)) colMapping.rank = idx;
                else if (['ATLETA', 'GIOCATORE', 'NOME', 'NOMINATIVO', 'ATLETA/SOCIETÀ'].includes(c)) {
                    colMapping.name = idx;
                    nameMatched = true;
                }
                else if (['TOT. SQ.', 'SQUADRA', 'TOT. SQUADRA', 'TEAM TOT.'].includes(c)) colMapping.teamTotal = idx;
                else if (['TOT', 'TOTALE', 'BIRILLI', 'TOT. GEN.', 'TOTAL', 'SCRATCH'].includes(c)) {
                    if (colMapping.total === -1 || c.includes('TOTALE')) colMapping.total = idx;
                }
                else if (['MEDIA', 'MED', 'AVG', 'MEDIA PUNTI'].includes(c)) colMapping.media = idx;
                else if (/^G\d+$/.test(c) || /^P\d+$/.test(c)) colMapping.scores.push(idx);
            });
            if (nameMatched && colMapping.rank !== -1) break;
        }

        // Fallback e sicurezza sulle mappature
        if (colMapping.name === -1) {
            // Cerchiamo una colonna che contenga principalmente testo lungo (nomi)
            for (let cIdx = 0; cIdx < (rows[0]?.length || 0); cIdx++) {
                if (rows.slice(0, 5).some(r => r[cIdx] && r[cIdx].length > 5 && isNaN(parseFloat(r[cIdx])))) {
                    colMapping.name = cIdx;
                    break;
                }
            }
            if (colMapping.name === -1) colMapping.name = 1;
        }

        if (colMapping.rank === -1) {
            colMapping.rank = colMapping.name === 0 ? -1 : 0;
        }

        // 3. PARSING DATI
        let lastRank = 1;
        rows.forEach((row, idx) => {
            if (row.length < 2) return;
            const rowStr = row.join(' ').toUpperCase();
            if (rowStr.includes('ATLETA') || rowStr.includes('POSIZIONE') || rowStr.includes('PAGINA')) return;

            let rank = parseInt(row[colMapping.rank]);
            if (isNaN(rank)) rank = lastRank;
            else lastRank = rank;

            let name = row[colMapping.name];
            // Se la colonna nome è vuota o numerica, cerchiamo nella riga
            if (!name || name.length < 3 || !isNaN(parseFloat(name)) || /^\d+$/.test(name)) {
                name = row.find(c => c.length > 4 && /^[A-Z\s'.]+$/i.test(c) && isNaN(parseFloat(c)));
            }

            if (!name || /GIOCATORE|TEAM|SQUADRA/i.test(name)) return;

            let scores = [];
            let total = 0;
            let media = 0;

            // Estrai punteggi se abbiamo colonne mappate o cerca numeri 50-300
            if (colMapping.scores.length > 0) {
                colMapping.scores.forEach(sIdx => {
                    const val = parseInt(row[sIdx]);
                    if (!isNaN(val) && val >= 50 && val <= 300) scores.push(val);
                });
            }

            // Se non abbiamo trovato scores dalle colonne, cerca in tutta la riga
            if (scores.length === 0) {
                row.forEach(cell => {
                    const val = parseInt(cell);
                    if (!isNaN(val) && val >= 50 && val <= 300 && !cell.includes('.')) scores.push(val);
                });
            }

            // Totale e Media
            if (colMapping.total !== -1) total = parseInt(row[colMapping.total]);
            if (colMapping.media !== -1) media = parseFloat(row[colMapping.media].replace(',', '.'));

            const sumScores = scores.reduce((a, b) => a + b, 0);

            // Logica per Totale Squadra:
            let teamTotal = 0;
            if (colMapping.teamTotal !== -1) {
                teamTotal = parseInt(row[colMapping.teamTotal]);
            } else {
                // Heuristic: cerca un valore sensibilmente più alto del totale individuale
                const numbers = row
                    .map(c => parseInt(c))
                    .filter(n => !isNaN(n) && n > sumScores && n > 200);

                if (numbers.length > 0) {
                    const candidate = Math.max(...numbers);
                    if (candidate > sumScores * 1.3) { // 1.3 è più permissivo per doppie squadre
                        teamTotal = candidate;
                    }
                }
            }

            if (!total || total < sumScores) total = sumScores;
            if (!media && scores.length > 0) media = total / scores.length;

            results.push({
                rank,
                player_name: name.toUpperCase(),
                points: total,
                media: media,
                punteggi_partite: scores,
                totale_squadra: teamTotal
            });
        });

        // 4. MATCHING CON DATABASE (Migliorato)
        const matched = results.map(res => {
            const matchedPlayer = players.find(p => {
                const normName = (n) => n.toUpperCase().replace(/[^A-Z]/g, '');
                const target = normName(res.player_name);
                const p1 = normName(`${p.nome}${p.cognome}`);
                const p2 = normName(`${p.cognome}${p.nome}`);

                // Match esatto o invertito
                if (target === p1 || target === p2) return true;

                // Match parziale (gestisce secondi nomi o titoli extra FISB)
                // Se il nome nel DB è contenuto in quello FISB o viceversa
                if (target.includes(p1) || target.includes(p2) || p1.includes(target) || p2.includes(target)) {
                    // Sicurezza: il match parziale deve essere significativo (min 6 caratteri comuni)
                    const commonLen = target.length > p1.length ? p1.length : target.length;
                    if (commonLen >= 6) return true;
                }

                return false;
            });

            return {
                ...res,
                playerId: matchedPlayer?.id || null,
                playerName: matchedPlayer ? `${matchedPlayer.nome} ${matchedPlayer.cognome}` : res.player_name,
                isMatched: !!matchedPlayer
            };
        });

        console.log(`=== Total results found: ${matched.length} ===`);
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
                media: r.media || 0,
                totale_squadra: r.totale_squadra || 0,
                punteggi_partite: r.punteggi_partite || [],
                partite: r.punteggi_partite && r.punteggi_partite.length > 0 ? r.punteggi_partite.length : (tournaments.find(t => t.id === selectedTournamentId)?.numero_partite || 6)
            }));

        if (finalResults.length === 0) {
            alert('Nessun atleta corrispondente trovato nel sistema.');
            return;
        }

        onSave(finalResults);
    };

    const handleCleanZeroResults = async () => {
        if (!window.confirm('Eliminare tutti i risultati con 0 birilli? Questa operazione non può essere annullata.')) return;

        const { data: toDelete, error: fetchError } = await supabase
            .from('results')
            .select('*')
            .eq('birilli', 0);

        if (fetchError) {
            alert('Errore: ' + fetchError.message);
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
            alert('Errore: ' + deleteError.message);
        } else {
            alert(`✅ Eliminati ${toDelete.length} risultati con 0 birilli!`);
        }
    };

    return (
        <div className="p-8 rounded-3xl neumorphic-out max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Upload className="w-6 h-6 text-blue-400" />
                    Importa Risultati FISB
                </h2>
                <button
                    onClick={handleCleanZeroResults}
                    className="px-4 py-2 rounded-xl neumorphic-btn bg-red-600/20 text-red-400 font-bold text-sm flex items-center gap-2 hover:bg-red-600/30 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Pulisci Risultati Vuoti
                </button>
            </div>

            {step === 1 ? (
                <div className="space-y-6">
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
                        {(() => {
                            const filtered = parsedResults.filter(r => !matchesOnly || r.isMatched);
                            const lastRenderedRank = { val: null };

                            return filtered.map((res, idx) => {
                                const isFirstVisibleInRank = lastRenderedRank.val !== res.rank;
                                if (isFirstVisibleInRank) lastRenderedRank.val = res.rank;

                                return (
                                    <div
                                        key={idx}
                                        className={`grid grid-cols-[3rem_1fr_4rem_4rem_5rem] items-center p-2 rounded-xl transition-colors gap-4
                                            ${res.isMatched ? 'bg-green-400/5 hover:bg-green-400/10 border border-green-400/10' : 'bg-red-400/5 opacity-40 border border-white/5'}
                                            ${isFirstVisibleInRank && idx !== 0 ? 'mt-3 border-t border-white/10 pt-3' : ''}`}
                                    >
                                        {/* RANGO */}
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${res.isMatched ? 'bg-green-400/20 text-green-400' : 'bg-gray-400/10 text-gray-500'}`}>
                                            {isFirstVisibleInRank ? res.rank : ''}
                                        </div>

                                        {/* INFO ATLETA */}
                                        <div className="min-w-0">
                                            <p className={`font-bold text-sm truncate ${res.isMatched ? 'text-gray-200' : 'text-gray-500'}`}>{res.player_name}</p>
                                            {res.isMatched ? (
                                                <p className="text-[10px] text-green-400 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> {res.playerName}
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-gray-600 italic">Non registrato</p>
                                            )}
                                        </div>

                                        {/* RISULTATI INCOLONNATI */}
                                        <div className="text-center">
                                            <p className={`text-lg font-black leading-none ${res.isMatched ? 'text-blue-400' : 'text-gray-600'}`}>{res.points}</p>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">birilli</p>
                                        </div>

                                        <div className="text-center border-l border-white/10 pl-2">
                                            <p className={`text-lg font-black leading-none ${res.isMatched ? 'text-purple-400' : 'text-gray-600'}`}>
                                                {((res.punteggi_partite?.length || 0) > 0 ? (res.points / res.punteggi_partite.length) : (res.media || 0)).toFixed(1)}
                                            </p>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">media</p>
                                        </div>

                                        <div className="text-center border-l border-white/10 pl-2">
                                            {isFirstVisibleInRank && res.totale_squadra > 0 ? (
                                                <>
                                                    <p className="text-lg font-black text-orange-400 leading-none">{res.totale_squadra}</p>
                                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Squadra</p>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        {parsedResults.filter(r => !matchesOnly || r.isMatched).length === 0 && (
                            <div className="py-20 text-center space-y-3 opacity-50">
                                <AlertCircle className="w-10 h-10 text-gray-500 mx-auto" />
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
