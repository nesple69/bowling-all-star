import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const stagioneAttiva = await prisma.stagione.findFirst({
        where: { attiva: true }
    });

    if (!stagioneAttiva) return;

    const ultimiTornei = await prisma.torneo.findMany({
        where: { completato: true, stagioneId: stagioneAttiva.id },
        take: 1,
        include: {
            risultati: {
                include: { giocatore: true }
            }
        }
    });

    console.log('--- DETTAGLIO RISULTATI ---');
    ultimiTornei[0]?.risultati.forEach(r => {
        console.log(`${r.giocatore.cognome} ${r.giocatore.nome} | Sesso: ${r.giocatore.sesso} | Cat: ${r.giocatore.categoria}`);
    });
}

check().finally(() => prisma.$disconnect());
