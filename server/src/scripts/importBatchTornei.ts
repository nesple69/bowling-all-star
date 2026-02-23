import { PrismaClient, TipologiaTorneo } from '@prisma/client';
import * as scrapingService from '../services/scrapingService';

const prisma = new PrismaClient();

interface TorneoConfig {
    url: string;
    tipologia: TipologiaTorneo;
    sede: string;
    partitePreviste: number;
}

// Lista di tornei da importare - popolata con i dati forniti dall'utente
const TORNEI_CONFIG: TorneoConfig[] = [
    {
        url: 'https://www.fisb.it/calendario2.html?view=classifica&id=15046',
        tipologia: 'SINGOLO',
        sede: 'Da Definire',
        partitePreviste: 6
    },
    {
        url: 'https://www.fisb.it/calendario2.html?view=classifica&id=15072',
        tipologia: 'SINGOLO',
        sede: 'Da Definire',
        partitePreviste: 6
    },
    {
        url: 'https://www.fisb.it/calendario2.html?view=classifica&id=15096',
        tipologia: 'SINGOLO',
        sede: 'Da Definire',
        partitePreviste: 6
    },
    {
        url: 'https://www.fisb.it/calendario2.html?view=classifica&id=15084',
        tipologia: 'SINGOLO',
        sede: 'Da Definire',
        partitePreviste: 6
    }
];

async function importTorneo(config: TorneoConfig) {
    console.log(`\n-- - INIZIO IMPORTAZIONE: ${config.url} --- `);

    try {
        // 1. Recupero Dati da FISB
        const scrapedData = await scrapingService.fetchTorneoFederazione(config.url);
        console.log(`Torneo trovato su FISB: ${scrapedData.nome} `);
        console.log(`Data: ${scrapedData.dataInizio.toISOString().split('T')[0]} `);

        // 2. Trova o Crea Torneo in DB
        const stagioneAttiva = await prisma.stagione.findFirst({ where: { attiva: true } });
        if (!stagioneAttiva) throw new Error('Nessuna stagione attiva trovata. Crea una stagione prima di importare.');

        let torneo = await prisma.torneo.findFirst({
            where: {
                nome: { contains: scrapedData.nome },
                stagioneId: stagioneAttiva.id
            }
        });

        if (!torneo) {
            console.log('Torneo non trovato. Creazione in corso con configurazione fornita...');
            torneo = await prisma.torneo.create({
                data: {
                    nome: scrapedData.nome,
                    tipologia: config.tipologia,
                    sede: config.sede,
                    partitePreviste: config.partitePreviste,
                    dataInizio: new Date(scrapedData.dataInizio),
                    completato: true,
                    stagioneId: stagioneAttiva.id
                }
            });
        } else {
            console.log(`Torneo esistente trovato(ID: ${torneo.id}).Aggiornamento impostazioni...`);
            torneo = await prisma.torneo.update({
                where: { id: torneo.id },
                data: {
                    tipologia: config.tipologia,
                    sede: config.sede,
                    partitePreviste: config.partitePreviste
                }
            });
        }
        console.log(`Torneo pronto: ${torneo.nome} (${torneo.tipologia} presso ${torneo.sede})`);

        // 3. Match e Creazione Giocatori (Fuori dalla transazione per evitare timeout)
        // Task list:
        // - [x] Supporto avanzato tornei Aziendali/Seniores (Sesso + Fascia A/B/C) <!-- id: 44 -->
        //     - [x] Creazione piano di implementazione <!-- id: 45 -->
        //     - [x] Aggiornamento `scrapingService.ts` con keyword "Fascia" <!-- id: 46 -->
        //     - [x] Logica di arricchimento divisione in `importController.ts` basata su dati DB <!-- id: 47 -->
        //     - [x] Test importazione con URL 15024 <!-- id: 48 -->
        // - [x] Suddivisione Categorie FISBB CUP (Eccellenza/Cadetti M/F) <!-- id: 41 -->
        //     - [x] Affinamento `scrapingService.ts` per combinazione keywords categoria <!-- id: 42 -->
        //     - [x] Verifica e re-importazione FISBB CUP <!-- id: 43 -->
        // - [x] Ottimizzazione Cronologia Dashboard <!-- id: 49 -->
        //     - [x] Ordinamento per `dataInizio` invece di `dataFine` <!-- id: 50 -->
        //     - [x] Raddoppio risultati visibili (take 4) <!-- id: 51 -->
        //     - [x] Marcamento automatico "Completato" all'importazione <!-- id: 52 -->
        // - [x] Link Istituzionali e Raffinamento Brand <!-- id: 53 -->
        //     - [x] Creazione componente `Footer.tsx` modulare <!-- id: 54 -->
        //     - [x] Integrazione link FISB e Regolamenti 2025-2026 <!-- id: 55 -->
        //     - [x] Ingrandimento Logo (Stella) e correzione dicitura "ALL STAR TEAM" <!-- id: 56 -->
        //     - [x] Rimozione box estetico sotto al logo <!-- id: 57 -->
        const playerNames = scrapedData.classifica.map(c => c.atleta);
        const matchingResults = await scrapingService.matchGiocatori(playerNames);

        const resultsWithGiocatoreId: any[] = [];
        let matchedCount = 0;
        let createdPlayersCount = 0;

        for (const item of scrapedData.classifica) {
            let match = matchingResults[item.atleta];
            let giocatoreId: string;

            if (match && match.score < 0.2) {
                giocatoreId = match.giocatoreId;
                matchedCount++;

                resultsWithGiocatoreId.push({
                    giocatoreId,
                    posizione: item.posizione,
                    partiteGiocate: item.partite || config.partitePreviste,
                    totaleBirilli: item.birilli,
                    punteggi: item.punteggiPartite,
                    divisione: item.divisione // Salviamo la divisione
                });
            } else {
                // SALTA atleti non presenti nel database
                // console.log(`Salto atleta estraneo: ${item.atleta}`);
                createdPlayersCount++; // Usiamo questo contatore per gli ignorati
            }
        }

        console.log(`Riconosciuti: ${matchedCount}. Ignorati (non in archivio): ${createdPlayersCount}.`);

        // 4. Salvataggio Risultati (In transazione con timeout aumentato)
        if (resultsWithGiocatoreId.length > 0) {
            await prisma.$transaction(async (tx) => {
                await tx.risultatoTorneo.deleteMany({ where: { torneoId: torneo!.id } });

                for (const resData of resultsWithGiocatoreId) {
                    const { punteggi, ...risultatoBase } = resData;

                    const risultato = await tx.risultatoTorneo.create({
                        data: {
                            torneoId: torneo!.id,
                            ...risultatoBase
                        }
                    });

                    // Salvataggio singole partite se presenti
                    if (punteggi && punteggi.length > 0) {
                        await tx.partitaTorneo.createMany({
                            data: punteggi.map((p: number, idx: number) => ({
                                risultatoTorneoId: risultato.id,
                                numeroPartita: idx + 1,
                                birilli: p
                            }))
                        });
                    }

                    // Aggiornamento medie e totali nel profilo giocatore
                    const tuttiG = await tx.risultatoTorneo.findMany({ where: { giocatoreId: resData.giocatoreId } });
                    const birilli = tuttiG.reduce((s, r) => s + r.totaleBirilli, 0);
                    const partite = tuttiG.reduce((s, r) => s + r.partiteGiocate, 0);

                    await tx.giocatore.update({
                        where: { id: resData.giocatoreId },
                        data: {
                            totaleBirilli: birilli,
                            mediaAttuale: partite > 0 ? birilli / partite : 0
                        }
                    });
                }
            }, {
                timeout: 60000 // Aumentato a 60s per gestire le sottomany
            });
            console.log('✅ Importazione completata con successo!');
        }
        else {
            console.warn('⚠️ Attenzione: Nessun giocatore del DB è stato riconosciuto nella classifica.');
        }

    } catch (error: any) {
        console.error(`❌ ERRORE durante l'importazione di [${config.url}]:`, error.message);
    }
}

async function main() {
    console.log('🚀 AVVIO PROCEDURA IMPORTAZIONE MASSIVA');

    if (TORNEI_CONFIG.length === 0) {
        console.log('Nessun torneo configurato. Aggiungi i dati in TORNEI_CONFIG.');
        return;
    }

    for (const config of TORNEI_CONFIG) {
        await importTorneo(config);
    }

    await prisma.$disconnect();
    console.log('\n🏁 PROCEDURA TERMINATA SALUTI');
}

main();
