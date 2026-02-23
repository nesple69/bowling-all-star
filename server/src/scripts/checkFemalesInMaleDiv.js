const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const risultati = await prisma.risultatoTorneo.findMany({
        where: { divisione: { contains: 'Maschile', mode: 'insensitive' } },
        include: { giocatore: true }
    });

    console.log('--- Atleti in Divisioni MASCHILI con Sesso nel DB ---');
    risultati.forEach(r => {
        if (r.giocatore.sesso === 'F') {
            console.log(`❌ DONNA IN DIV MASCHILE: ${r.giocatore.cognome} ${r.giocatore.nome} | Divisione: ${r.divisione} | Sesso DB: ${r.giocatore.sesso}`);
        } else {
            // console.log(`OK: ${r.giocatore.cognome} | Divisione: ${r.divisione}`);
        }
    });

    await prisma.$disconnect();
}

main();
