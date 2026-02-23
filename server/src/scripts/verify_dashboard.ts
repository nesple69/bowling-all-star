import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
    console.log('--- VERIFICA QUERY DASHBOARD ---');

    const stagioneAttiva = await prisma.stagione.findFirst({
        where: { attiva: true }
    });

    if (!stagioneAttiva) {
        console.log('ERRORE: Nessuna stagione attiva!');
        return;
    }

    const ultimiTornei = await prisma.torneo.findMany({
        where: {
            completato: true,
            stagioneId: stagioneAttiva.id
        },
        include: {
            risultati: {
                orderBy: { posizione: 'asc' },
                take: 10,
                include: { giocatore: true }
            }
        }
    });

    console.log(`Tornei completati trovati: ${ultimiTornei.length}`);
    ultimiTornei.forEach(t => {
        console.log(`- ${t.nome} | Risultati top 10: ${t.risultati.length}`);
        t.risultati.forEach(r => {
            console.log(`  [${r.posizione}] ${r.giocatore.cognome} ${r.giocatore.nome} - Birilli: ${r.totaleBirilli}`);
        });
    });
}

verify().finally(() => prisma.$disconnect());
