import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import * as scrapingService from '../services/scrapingService';

export const getPreview = async (req: Request, res: Response) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL mancante o non valido.' });
    }

    try {
        const scrapedData = await scrapingService.fetchTorneoFederazione(url);
        const playerNames = scrapedData.classifica.map(c => c.atleta);
        const matchingResults = await scrapingService.matchGiocatori(playerNames);

        res.json({
            torneo: scrapedData.nome,
            dataInizio: scrapedData.dataInizio,
            classifica: scrapedData.classifica.map(c => {
                const match = matchingResults[c.atleta];
                return {
                    ...c,
                    match: (match && match.score < 0.2) ? match : null
                };
            })
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const importTorneoData = async (req: Request, res: Response) => {
    const { url, torneoId, matchesOverride } = req.body;

    console.log(`🚀 Avvio importazione torneo ID: ${torneoId} da URL: ${url}`);
    if (matchesOverride) {
        console.log(`📝 Ricevute ${Object.keys(matchesOverride).length} corrispondenze manuali.`);
    }

    if (!url || !torneoId) {
        return res.status(400).json({ error: 'URL e torneoId sono richiesti.' });
    }

    try {
        const scrapedData = await scrapingService.fetchTorneoFederazione(url);
        const playerNames = scrapedData.classifica.map(c => c.atleta);
        const matchingResults = await scrapingService.matchGiocatori(playerNames);

        const resultsToSave: {
            torneoId: string;
            giocatoreId: string;
            posizione: number;
            partiteGiocate: number;
            totaleBirilli: number;
            totaleBirilliSquadra?: number | null;
            partite: number[];
            divisione: string | null;
        }[] = [];
        const unmatched = [];

        const isAziendaleOSenior = scrapedData.nome.toUpperCase().includes('AZIENDALE') ||
            scrapedData.nome.toUpperCase().includes('SENIORES') ||
            scrapedData.nome.toUpperCase().includes('SENIOR');

        for (const item of scrapedData.classifica) {
            // Priorità alla corrispondenza manuale
            let giocatoreId = matchesOverride ? matchesOverride[item.atleta] : null;

            if (!giocatoreId) {
                const match = matchingResults[item.atleta];
                if (match && match.score < 0.2) { // Abbassata soglia da 0.3 per evitare false positive come Massimiliano Celli
                    giocatoreId = match.giocatoreId;
                }
            }

            if (giocatoreId) {
                let divisioneVal = item.divisione || null;

                // Se è un torneo Aziendale/Senior, forziamo la divisione dal DB se possibile
                if (isAziendaleOSenior) {
                    const giocatoreDb = await prisma.giocatore.findUnique({
                        where: { id: giocatoreId },
                        select: { sesso: true, fasciaSenior: true }
                    });

                    if (giocatoreDb) {
                        const sessoStr = giocatoreDb.sesso === 'F' ? 'Femminile' : 'Maschile';
                        const fasciaStr = giocatoreDb.fasciaSenior !== 'NONE' ? ` Fascia ${giocatoreDb.fasciaSenior}` : '';
                        divisioneVal = `${sessoStr}${fasciaStr}`;
                        console.log(`[IMPORT] Arricchita divisione per ${item.atleta}: ${divisioneVal}`);
                    }
                }

                resultsToSave.push({
                    torneoId,
                    giocatoreId,
                    posizione: item.posizione,
                    partiteGiocate: item.partite,
                    totaleBirilli: item.birilli,
                    totaleBirilliSquadra: item.totaleBirilliSquadra || null,
                    partite: item.punteggiPartite,
                    divisione: divisioneVal
                });
            } else {
                unmatched.push(item.atleta);
            }
        }

        console.log(`📊 Risultati da salvare: ${resultsToSave.length}, Non matchati: ${unmatched.length}`);

        // Utilizziamo una transazione per salvare i risultati e aggiornare le medie
        try {
            await prisma.$transaction(async (tx) => {
                // Rimuovi vecchi risultati per questo torneo se presenti
                console.log(`🧹 Pulizia vecchi risultati per torneo ${torneoId}...`);
                await tx.risultatoTorneo.deleteMany({
                    where: { torneoId }
                });

                // Marca il torneo come completato e aggiorna le date se disponibili
                await tx.torneo.update({
                    where: { id: torneoId },
                    data: {
                        completato: true,
                        dataInizio: scrapedData.dataInizio,
                        dataFine: scrapedData.dataFine || undefined
                    }
                });

                // Inserisci nuovi risultati
                for (const resData of resultsToSave) {
                    const { partite, ...risultatoData } = resData;
                    const createdRisultato = await tx.risultatoTorneo.create({
                        data: risultatoData
                    });

                    // Salva le singole partite
                    if (partite && partite.length > 0) {
                        await tx.partitaTorneo.createMany({
                            data: partite.map((p, index) => ({
                                risultatoTorneoId: createdRisultato.id,
                                numeroPartita: index + 1,
                                birilli: p,
                                data: new Date() // Opzionale
                            }))
                        });
                    }

                    // Aggiorna statistiche giocatore (totale birilli e media)
                    const tuttiRisultati = await tx.risultatoTorneo.findMany({
                        where: { giocatoreId: resData.giocatoreId }
                    });

                    const totaleBirilli = tuttiRisultati.reduce((sum, r) => sum + r.totaleBirilli, 0);
                    const totalePartite = tuttiRisultati.reduce((sum, r) => sum + r.partiteGiocate, 0);
                    const mediaAttuale = totalePartite > 0 ? totaleBirilli / totalePartite : 0;

                    await tx.giocatore.update({
                        where: { id: resData.giocatoreId },
                        data: {
                            totaleBirilli,
                            mediaAttuale
                        }
                    });
                }
            }, {
                timeout: 30000 // 30 secondi per gestire molti risultati
            });

            console.log('✅ Importazione completata con successo!');
            res.json({
                message: 'Importazione completata con successo.',
                salvati: resultsToSave.length,
                nonMatchati: unmatched
            });
        } catch (transactionError: any) {
            console.error('❌ Errore durante la transazione Prisma:', transactionError);
            res.status(500).json({ error: `Errore database: ${transactionError.message}` });
        }
    } catch (error: any) {
        console.error('❌ Errore generale nell\'importazione:', error);
        res.status(500).json({ error: error.message });
    }
};
