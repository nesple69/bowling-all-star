const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const risultati = await prisma.risultatoTorneo.findMany({
        include: { giocatore: true }
    });

    console.log('--- Rilevamento Incoerenze Sex vs Division ---');
    risultati.forEach(r => {
        const div = (r.divisione || '').toUpperCase();
        const sesso = (r.giocatore.sesso || '').toUpperCase();

        const isMaschileInDiv = div.includes('MASCHILE');
        const isFemminileInDiv = div.includes('FEMMINILE');

        if (isMaschileInDiv && sesso === 'F') {
            console.log(`❌ DONNA IN DIV MASCHILE: ${r.giocatore.cognome} ${r.giocatore.nome} | Divisione: ${r.divisione}`);
        }
        if (isFemminileInDiv && sesso === 'M') {
            console.log(`❌ UOMO IN DIV FEMMINILE: ${r.giocatore.cognome} ${r.giocatore.nome} | Divisione: ${r.divisione}`);
        }
    });

    await prisma.$disconnect();
}

main();
