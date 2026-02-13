import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listPlayers() {
    const giocatori = await prisma.giocatore.findMany({
        select: {
            nome: true,
            cognome: true
        }
    });

    console.log('--- GIOCATORI TESSERATI NEL DB ---');
    giocatori.forEach(g => {
        console.log(`- ${g.cognome.toUpperCase()} ${g.nome.toUpperCase()}`);
    });
    console.log('--- FINE LISTA ---');
    await prisma.$disconnect();
}

listPlayers().catch(console.error);
