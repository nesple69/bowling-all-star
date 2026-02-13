import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
    const giocatori = await prisma.giocatore.findMany({
        take: 10,
        select: {
            nome: true,
            cognome: true,
            sesso: true,
            categoria: true
        }
    });

    console.log('--- CAMPIONE DATI GIOCATORI ---');
    giocatori.forEach(g => {
        console.log(`${g.cognome} ${g.nome} | Sesso: [${g.sesso}] | Categoria: [${g.categoria}]`);
    });
}

checkData().finally(() => prisma.$disconnect());
