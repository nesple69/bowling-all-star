const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const giocatori = await prisma.giocatore.findMany({
        where: {
            OR: [
                { sesso: null },
                { sesso: '' }
            ]
        }
    });

    console.log('--- Giocatori senza Sesso ---');
    giocatori.forEach(g => {
        console.log(`⚠️ MANCANTE: ${g.cognome} ${g.nome} (Tessera: ${g.numeroTessera})`);
    });

    await prisma.$disconnect();
}

main();
