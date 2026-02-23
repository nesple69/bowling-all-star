const { fetchTorneoFederazione, matchGiocatori } = require('../services/scrapingService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEnrichment() {
    console.log('--- TEST ARRICCHIMENTO DIVISIONI (15024) ---');
    try {
        const scrapedData = await fetchTorneoFederazione('https://www.fisb.it/calendario2.html?view=classifica&id=15024');
        const playerNames = scrapedData.classifica.map(c => c.atleta);
        const matchingResults = await matchGiocatori(playerNames);

        const isAziendaleOSenior = scrapedData.nome.toUpperCase().includes('AZIENDALE') ||
            scrapedData.nome.toUpperCase().includes('SENIORES') ||
            scrapedData.nome.toUpperCase().includes('SENIOR');

        console.log(`Torneo: ${scrapedData.nome} | Analisi Aziendale/Senior: ${isAziendaleOSenior}`);

        for (const item of scrapedData.classifica.slice(0, 10)) {
            const match = matchingResults[item.atleta];
            if (match && match.score < 0.2) {
                const giocatoreDb = await prisma.giocatore.findUnique({
                    where: { id: match.giocatoreId },
                    select: { nome: true, cognome: true, sesso: true, fasciaSenior: true }
                });

                if (giocatoreDb) {
                    const sessoStr = giocatoreDb.sesso === 'F' ? 'Femminile' : 'Maschile';
                    const fasciaStr = giocatoreDb.fasciaSenior !== 'NONE' ? ` Fascia ${giocatoreDb.fasciaSenior}` : '';
                    const enrichedDiv = `${sessoStr}${fasciaStr}`;
                    console.log(`[TEST] Atleta: ${giocatoreDb.cognome} ${giocatoreDb.nome} | Originale: "${item.divisione}" | Arricchita: "${enrichedDiv}"`);
                }
            } else {
                console.log(`[TEST] Nessun match per: ${item.atleta}`);
            }
        }
    } catch (err) {
        console.error('Errore:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

testEnrichment();
