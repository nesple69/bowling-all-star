import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
    console.log('--- DIAGNOSTICA DETTAGLIATA RISULTATI ---');

    const risultati = await prisma.risultatoTorneo.findMany({
        include: {
            giocatore: true,
            torneo: true
        },
        take: 5
    });

    risultati.forEach(r => {
        console.log(`Atleta: ${r.giocatore.cognome} ${r.giocatore.nome}`);
        console.log(`Torneo: ${r.torneo.nome}`);
        console.log(`Partite: ${r.partiteGiocate}`);
        console.log(`Birilli: ${r.totaleBirilli}`);
        console.log('---');
    });
}

debug().finally(() => prisma.$disconnect());
