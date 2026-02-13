import { PrismaClient } from '@prisma/client';
import Fuse from 'fuse.js';

const prisma = new PrismaClient();

async function testMatch() {
    const giocatoriDb = await prisma.giocatore.findMany({
        select: { id: true, nome: true, cognome: true }
    });

    const listToSearch = giocatoriDb.map(g => ({
        id: g.id,
        fullName: `${g.cognome} ${g.nome}`.toLowerCase(),
        reversedName: `${g.nome} ${g.cognome}`.toLowerCase(),
        original: `${g.cognome} ${g.nome}`
    }));

    const options = {
        keys: ['fullName', 'reversedName'],
        threshold: 0.2,
        includeScore: true
    };

    const fuse = new Fuse(listToSearch, options);
    const target = "MASSIMILIANO CELLI";
    const results = fuse.search(target.toLowerCase());

    console.log(`Matching per: ${target}`);
    if (results.length > 0) {
        results.forEach((r, i) => {
            console.log(`${i + 1}. Result: ${r.item.original} | Score: ${r.score}`);
        });
    } else {
        console.log("Nessun match trovato.");
    }

    await prisma.$disconnect();
}

testMatch();
