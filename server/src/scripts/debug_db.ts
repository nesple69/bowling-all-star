import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
    console.log('--- DIAGNOSTICA DATABASE ---');

    const countGiocatori = await prisma.giocatore.count();
    console.log('Giocatori Totali:', countGiocatori);

    const tornei = await prisma.torneo.findMany({
        include: {
            _count: {
                select: { risultati: true, iscrizioni: true }
            }
        }
    });

    console.log('Tornei in DB:', tornei.length);
    tornei.forEach(t => {
        console.log(`- [${t.completato ? 'FINITO' : 'APERTO'}] ${t.nome}: ${t._count.risultati} risultati, ${t._count.iscrizioni} iscrizioni`);
    });

    const totalRisultati = await prisma.risultatoTorneo.count();
    console.log('Risultati Totali in DB:', totalRisultati);

    const stagioni = await prisma.stagione.findMany();
    console.log('Stagioni:', stagioni.map(s => `${s.nome} (${s.attiva ? 'ATTIVA' : 'INATTIVA'})`).join(', '));
}

debug().finally(() => prisma.$disconnect());
