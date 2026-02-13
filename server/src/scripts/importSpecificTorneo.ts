import { PrismaClient } from '@prisma/client';
import * as scrapingService from '../services/scrapingService';

const prisma = new PrismaClient();
const FISB_URL = 'https://www.fisb.it/calendario2.html?view=classifica&id=15013';

async function main() {
    console.log('--- INIZIO IMPORTAZIONE FISB 15013 ---');

    try {
        // 1. Recupero Dati da FISB
        const scrapedData = await scrapingService.fetchTorneoFederazione(FISB_URL);
        console.log(`Torneo trovato su FISB: ${scrapedData.nome}`);
        console.log(`Data Inizio: ${scrapedData.dataInizio}`);

        // 2. Trova o Crea Torneo in DB
        // Cerchiamo nella stagione attiva
        const stagioneAttiva = await prisma.stagione.findFirst({ where: { attiva: true } });
        if (!stagioneAttiva) throw new Error('Nessuna stagione attiva trovata');

        let torneo = await prisma.torneo.findFirst({
            where: {
                nome: { contains: scrapedData.nome },
                stagioneId: stagioneAttiva.id
            }
        });

        if (!torneo) {
            console.log('Torneo non trovato nel DB. Lo creo...');
            torneo = await prisma.torneo.create({
                data: {
                    nome: scrapedData.nome,
                    tipologia: 'SINGOLO', // Default per questo tipo di classifica
                    sede: 'Da Definire',
                    dataInizio: new Date(scrapedData.dataInizio),
                    completato: true,
                    stagioneId: stagioneAttiva.id
                }
            });
        }
        console.log(`Torneo ID nel DB: ${torneo.id}`);

        // 3. Match Giocatori
        const playerNames = scrapedData.classifica.map(c => c.atleta);
        console.log('Nomi estratti da FISB:', playerNames);

        const giocatoriDb = await prisma.giocatore.findMany({ select: { nome: true, cognome: true } });
        console.log('Esempio giocatori in DB:', giocatoriDb.slice(0, 5).map(g => `${g.cognome} ${g.nome}`));

        const matchingResults = await scrapingService.matchGiocatori(playerNames);

        const resultsToSave: any[] = [];
        let matchedCount = 0;

        for (const item of scrapedData.classifica) {
            const match = matchingResults[item.atleta];
            if (match && match.score < 0.3) { // Soglia di confidenza
                resultsToSave.push({
                    torneoId: torneo.id,
                    giocatoreId: match.giocatoreId,
                    posizione: item.posizione,
                    partiteGiocate: item.partite,
                    totaleBirilli: item.birilli,
                });
                matchedCount++;
            }
        }

        console.log(`Giocatori riconosciuti: ${matchedCount} su ${scrapedData.classifica.length}`);

        // 4. Salvataggio
        if (resultsToSave.length > 0) {
            await prisma.$transaction(async (tx) => {
                // Pulisci vecchi risultati
                await tx.risultatoTorneo.deleteMany({ where: { torneoId: torneo.id } });

                // Inserisci nuovi
                for (const resData of resultsToSave) {
                    await tx.risultatoTorneo.create({ data: resData });

                    // Aggiorna media giocatore
                    const tutti = await tx.risultatoTorneo.findMany({ where: { giocatoreId: resData.giocatoreId } });
                    const birilli = tutti.reduce((s, r) => s + r.totaleBirilli, 0);
                    const partite = tutti.reduce((s, r) => s + r.partiteGiocate, 0);

                    await tx.giocatore.update({
                        where: { id: resData.giocatoreId },
                        data: {
                            totaleBirilli: birilli,
                            mediaAttuale: partite > 0 ? birilli / partite : 0
                        }
                    });
                }
            });
            console.log('Importazione completata con successo!');
        } else {
            console.warn('Nessun giocatore riconosciuto. L\'importazione non ha salvato nulla.');
        }

    } catch (error) {
        console.error('ERRORE DURANTE L\'IMPORTAZIONE:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
