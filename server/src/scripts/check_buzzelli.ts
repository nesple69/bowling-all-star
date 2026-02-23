import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkBuzzelli() {
    console.log('--- ISPEZIONE DATI: BUZZELLI DANIELA ---');

    // 1. Controllo Scheda Giocatore
    const giocatore = await prisma.giocatore.findFirst({
        where: {
            AND: [
                { cognome: { contains: 'BUZZELLI', mode: 'insensitive' } },
                { nome: { contains: 'DANIELA', mode: 'insensitive' } }
            ]
        }
    });

    if (giocatore) {
        console.log('SCHEDA GIOCATORE:');
        console.log(`- Nome: ${giocatore.cognome} ${giocatore.nome}`);
        console.log(`- Sesso: ${giocatore.sesso}`);
        console.log(`- Categoria: ${giocatore.categoria}`);
        console.log(`- ID: ${giocatore.id}`);
    } else {
        console.log('ERRORE: Giocatore non trovato nella scheda anagrafica.');
    }

    // 2. Controllo Risultati Torneo
    const risultati = await prisma.risultatoTorneo.findMany({
        where: { giocatoreId: giocatore?.id },
        include: { torneo: true }
    });

    console.log('\nRISULTATI TORNEO:');
    if (risultati.length > 0) {
        risultati.forEach(r => {
            console.log(`- Torneo: ${r.torneo.nome}`);
            console.log(`  Posizione: ${r.posizione} | Birilli: ${r.totaleBirilli}`);
            // Nota: La categoria non è presente in RisultatoTorneo nel DB, 
            // viene letta tramite join dalla scheda giocatore.
        });
    } else {
        console.log('Nessun risultato trovato per questo giocatore.');
    }
}

checkBuzzelli().finally(() => prisma.$disconnect());
