import React, { useState } from 'react';
import { Upload, X, Trophy, Save, List, CheckCircle, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const TournamentImportV2 = ({ players, tournaments, onSave, onCancel }) => {
    const [htmlContent, setHtmlContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState(1);
    const [parsedResults, setParsedResults] = useState([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState('');
    const [matchesOnly, setMatchesOnly] = useState(false);

    const cleanStr = (s) => {
        if (!s) return '';
        return s.toString()
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&[a-z]+;/g, '')
            .replace(/[\t\n\r]/g, ' ')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, ' ')
            .trim();
    };

    const parseContent = () => {
        console.log('Parser: Starting analysis...');
        if (!htmlContent || !htmlContent.trim()) {
            alert('Per favore, incolla i dati nel riquadro prima di analizzare.');
            return;
        }

        let rows = [];

        // --- 1. PROVA PARSING HTML ---
        if (htmlContent.toLowerCase().includes('<tr') || htmlContent.toLowerCase().includes('<td')) {
            console.log('Parser: Utilizzo DOMParser per HTML');
            try {
                const domParser = new DOMParser();
                const doc = domParser.parseFromString(htmlContent, 'text/html');
                const htmlRows = doc.querySelectorAll('tr');

                htmlRows.forEach(tr => {
                    const cells = Array.from(tr.querySelectorAll('td, th')).map(td => cleanStr(td.innerHTML));
                    if (cells.length > 0) rows.push(cells);
                });
            } catch (err) {
                console.error('Parser: Errore DOMParser', err);
            }
        }

        // --- 2. FALLBACK PARSING TESTO ---
        if (rows.length === 0) {
            console.log('Parser: Utilizzo Text Mode');
            rows = htmlContent.split('\n')
                .map(line => {
                    // Prova Tab, multi-spazio o singolo spazio come ultimo fallback
                    let parts = line.split(/\t|\s{2,}/).map(cleanStr).filter(c => c.length > 0);
                    if (parts.length < 3) {
                        parts = line.split(/\s+/).map(cleanStr).filter(c => c.length > 0);
                    }
                    return parts;
                })
                .filter(r => r.length > 1);
        }

        if (rows.length === 0) {
            alert('Nessun dato trovato. Assicurati di aver copiato correttamente la tabella del sito FISB.');
            return;
        }

        // --- 3. MAPPATURA COLONNE ---
        let colMapping = { rank: -1, name: -1, scores: [], total: -1, media: -1, teamTotal: -1 };
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i];
            let foundAny = false;
            row.forEach((cell, idx) => {
                const c = cell.toUpperCase().trim();
                if (['POS', 'RANGO', 'POS.', '#', 'POSIZIONE', 'CL', 'POSIZ.', 'POSS'].includes(c)) { colMapping.rank = idx; foundAny = true; }
                else if (['ATLETA', 'GIOCATORE', 'NOME', 'NOMINATIVO', 'GIOCATORI', 'COGNOME NOME'].includes(c)) { colMapping.name = idx; foundAny = true; }
                else if (['SQUADRA', 'TOT. SQUADRA', 'TOT. SQ.', 'TEAM TOT.', 'TOT.SQUADRA'].includes(c)) colMapping.teamTotal = idx;
                else if (['TOT', 'TOTALE', 'BIRILLI', 'SCRATCH', 'TOT.', 'SCR'].includes(c)) colMapping.total = idx;
                else if (['MEDIA', 'MED', 'AVG', 'MED.'].includes(c)) colMapping.media = idx;
                else if (/^G\d+$/.test(c) || /^P\d+$/.test(c)) colMapping.scores.push(idx);
            });
            if (foundAny && colMapping.name !== -1) break;
        }
        console.log('Parser: Mapping rilevato:', colMapping);

        // Heuristics if mapping failed
        if (colMapping.name === -1) colMapping.name = rows[0].length >= 2 ? 1 : 0;
        if (colMapping.rank === -1) colMapping.rank = colMapping.name === 0 ? -1 : 0;

        // --- 4. ESTRAZIONE RISULTATI ---
        let results = [];
        let lastRank = 1;
        let currentSection = null;

        rows.forEach((row) => {
            const rowStr = row.join(' ').toUpperCase();

            // Sezione Categories (ECCELLENZA, etc)
            const sectionKeywords = ['ECCELLENZA', 'CADETTI', 'FEMMINILE', 'GENTLEMAN', 'M/A', 'M/B', 'M/C', 'F/A', 'MISTA'];
            const foundSection = sectionKeywords.find(k => rowStr.includes(k) && row.length < 3);
            if (foundSection) {
                currentSection = rowStr.replace(/PAGINA\s+\d+/g, '').trim();
                return;
            }

            // Filtra intestazioni
            if (rowStr.includes('POSIZIONE') || rowStr.includes('ATLETA') || rowStr.includes('PAGINA')) return;

            // Nickname/Name detection
            let name = row[colMapping.name];
            if (!name || name.length < 3 || !isNaN(name)) {
                name = row.find(c => c.length > 5 && isNaN(c) && !c.includes('.'));
            }
            if (!name || name.length < 3 || /TEAM|SQUADRA|FISB|PAGINA|GIOCATORE|CAMPIONATO|CATEGOR|CAT\.|COGNOME|NOME/i.test(name)) {
                console.log('Parser: Riga scartata (noise/header):', name);
                return;
            }

            // Scores detection
            let scores = [];
            row.forEach((cell, idx) => {
                if (idx === colMapping.name || idx === colMapping.rank) return;
                const val = parseInt(cell.toString().replace(/[^0-9]/g, ''));
                if (!isNaN(val) && val >= 40 && val <= 300) scores.push(val);
            });

            const sumScores = scores.reduce((a, b) => a + b, 0);
            let total = 0;
            if (colMapping.total !== -1 && row[colMapping.total]) {
                total = parseInt(row[colMapping.total].toString().replace(/[^0-9]/g, '')) || 0;
            }
            if (total < sumScores || total === 0) total = sumScores;

            console.log(`Row Debug [${name}]: Games=${scores.join(',')} Sum=${sumScores} FinalTotal=${total}`);

            results.push({
                rank: parseInt(row[colMapping.rank]) || lastRank++,
                player_name: name.toUpperCase(),
                points: total,
                media: (total / (scores.length || 1)),
                punteggi_partite: scores,
                categoria_risultato: currentSection
            });
        });

        // --- 5. MATCHING PLAYERS ---
        console.group('🔍 PLAYER MATCHING DEBUG');
        const matched = results.map(res => {
            const norm = (n) => {
                if (!n) return '';
                return n.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, '');
            };

            const target = norm(res.player_name);

            const matchedPlayer = players.find(p => {
                const nOriginal = norm(p.nome);
                const cOriginal = norm(p.cognome);
                const p1 = nOriginal + cOriginal;
                const p2 = cOriginal + nOriginal;

                // 1. Exact match (N+C or C+N)
                if (target === p1 || target === p2) return true;

                // 2. Partial match (Database Name and Surname both contained in the target)
                if (nOriginal.length > 2 && cOriginal.length > 2) {
                    if (target.includes(nOriginal) && target.includes(cOriginal)) return true;
                }

                // 3. Fallback: Surname contained and Name initial matches
                if (cOriginal.length > 3 && target.includes(cOriginal)) {
                    if (nOriginal.length > 0 && target.includes(nOriginal[0])) return true;
                }

                return false;
            });

            if (matchedPlayer) {
                console.log(`✅ MATCH: "${res.player_name}" -> ${matchedPlayer.nome} ${matchedPlayer.cognome}`);
            } else {
                console.warn(`❌ NO MATCH: "${res.player_name}" (Normalized: ${target})`);
            }

            return {
                ...res,
                playerId: matchedPlayer?.id || null,
                playerName: matchedPlayer ? `${matchedPlayer.nome} ${matchedPlayer.cognome}` : res.player_name,
                isMatched: !!matchedPlayer
            };
        });
        console.groupEnd();

        if (matched.length === 0) {
            alert('Analisi completata, ma non è stato possibile estrarre atleti validi. Controlla il formato dei dati.');
            return;
        }

        setParsedResults(matched);
        setStep(2);
    };

    const handleConfirm = async () => {
        if (!selectedTournamentId) return alert('Seleziona un torneo.');
        const toSave = parsedResults.filter(r => r.isMatched).map(r => ({
            id_giocatore: r.playerId,
            id_torneo: selectedTournamentId,
            posizione: r.rank,
            birilli: r.points,
            media: r.media || 0,
            categoria_risultato: r.categoria_risultato,
            punteggi_partite: r.punteggi_partite || [],
            partite: r.punteggi_partite?.length || 6
        }));

        if (toSave.length === 0) return alert('Nessun atleta abbinato da salvare.');

        setIsSaving(true);
        try {
            console.log('📤 TournamentImportV2 sending:', toSave);
            await onSave(toSave);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 rounded-3xl neumorphic-out max-w-4xl mx-auto space-y-6">
            <div className="bg-red-500/20 border border-red-500/40 p-3 rounded-xl text-center">
                <p className="text-red-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">
                    ⚠️ MODALITÀ MANUALE V2.3 ATTIVA ⚠️
                </p>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Upload className="w-6 h-6 text-blue-400" />
                    Importazione Risultati
                </h2>
                <button onClick={onCancel} className="p-2 rounded-xl hover:bg-white/10 text-gray-400">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* TORNEO SELECT - SEMPRE VISIBILE */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] ml-2">Torneo di Destinazione</label>
                <select
                    value={selectedTournamentId}
                    onChange={(e) => setSelectedTournamentId(e.target.value)}
                    className="w-full p-3 rounded-xl neumorphic-in focus:outline-none bg-transparent text-sm"
                >
                    <option value="">Scegli il torneo...</option>
                    {tournaments.map(t => (
                        <option key={t.id} value={t.id} className="bg-[#1a1a1a]">{t.nome}</option>
                    ))}
                </select>
            </div>

            {step === 1 ? (
                <div className="space-y-6 animate-fadeIn">
                    <textarea
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        className="w-full h-80 p-4 rounded-xl neumorphic-in focus:outline-none font-mono text-[10px] text-gray-300 custom-scrollbar"
                        placeholder="Incolla qui la classifica (HTML o Testo)..."
                    />
                    <div className="flex gap-4">
                        <button onClick={onCancel} className="flex-1 py-4 rounded-xl neumorphic-btn font-bold text-gray-400">Annulla</button>
                        <button
                            onClick={parseContent}
                            disabled={!selectedTournamentId || !htmlContent.trim()}
                            className="flex-1 py-4 rounded-xl neumorphic-btn bg-blue-600/20 text-blue-400 font-bold disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            <Trophy className="w-5 h-5" /> Analizza e Procedi
                        </button>
                    </div>
                    {!selectedTournamentId && <p className="text-center text-[10px] text-orange-400 font-bold">Seleziona un torneo per attivare l'analisi</p>}
                </div>
            ) : (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{parsedResults.length} Risultati trovati</p>
                        <button
                            onClick={() => setMatchesOnly(!matchesOnly)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${matchesOnly ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-400'}`}
                        >
                            {matchesOnly ? 'Solo registrati' : 'Tutti i dati'}
                        </button>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto rounded-2xl border border-white/5 bg-black/30 custom-scrollbar p-2 space-y-1">
                        {parsedResults.filter(r => !matchesOnly || r.isMatched).map((res, idx) => (
                            <div key={idx} className={`flex items-center p-3 rounded-xl gap-4 border ${res.isMatched ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-white/5 opacity-50'}`}>
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs">{res.rank}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate uppercase">{res.player_name}</p>
                                    <p className={`text-[10px] font-bold ${res.isMatched ? 'text-green-400' : 'text-gray-500'}`}>
                                        {res.isMatched ? `Abbinato: ${res.playerName}` : 'Sconosciuto'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-blue-400 leading-none">{res.points}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Tot</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-xl neumorphic-btn font-bold text-gray-400">Indietro</button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSaving || parsedResults.filter(r => r.isMatched).length === 0}
                            className="flex-1 py-4 rounded-xl neumorphic-btn bg-green-600/20 text-green-400 font-bold disabled:opacity-30"
                        >
                            {isSaving ? 'Salvataggio...' : `Salva (${parsedResults.filter(r => r.isMatched).length})`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentImportV2;
