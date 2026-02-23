const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const risultati = await prisma.risultatoTorneo.findMany({
        where: { divisione: { contains: 'Femminile', mode: 'insensitive' } },
        include: { giocatore: true }
    });

    console.log('--- Atleti in Divisioni FEMMINILI con Sesso nel DB ---');
    risultati.forEach(r => {
        console.log(`Atleta: ${r.giocatore.cognome} ${r.giocatore.nome} | Divisione: ${r.divisione} | Sesso DB: ${r.giocatore.sesso}`);
    });

    await prisma.$disconnect();
}

main();
