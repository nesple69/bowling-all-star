const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const torneo = await prisma.torneo.findFirst({
        where: { nome: { contains: 'Fisbb Cup' } }
    });

    if (!torneo) {
        console.log('Torneo non trovato');
        return;
    }

    const risultati = await prisma.risultatoTorneo.findMany({
        where: { torneoId: torneo.id },
        include: { giocatore: true },
        orderBy: [
            { divisione: 'asc' },
            { posizione: 'asc' }
        ]
    });

    console.log(`Risultati per: ${torneo.nome}`);
    risultati.forEach(r => {
        console.log(`[${r.divisione}] Pos ${r.posizione}: ${r.giocatore.cognome} ${r.giocatore.nome} (Sesso: ${r.giocatore.sesso || 'N/D'})`);
    });

    await prisma.$disconnect();
}

main();
