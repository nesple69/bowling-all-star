import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    console.log('🧹 Inizio pulizia atleti non tesserati...');

    // Identifichiamo i giocatori creati automaticamente (hanno data di nascita 1970-01-01)
    const playersToDelete = await prisma.giocatore.findMany({
        where: {
            dataNascita: new Date('1970-01-01')
        },
        select: {
            id: true,
            userId: true,
            nome: true,
            cognome: true
        }
    });

    console.log(`Trovati ${playersToDelete.length} atleti da rimuovere.`);

    for (const player of playersToDelete) {
        process.stdout.write(`Eliminazione ${player.cognome} ${player.nome}... `);

        // 1. Risultati Torneo
        await prisma.risultatoTorneo.deleteMany({ where: { giocatoreId: player.id } });

        // 2. Iscrizioni Torneo
        await prisma.iscrizioneTorneo.deleteMany({ where: { giocatoreId: player.id } });

        // 3. Saldo Borsellino
        await prisma.saldoBorsellino.deleteMany({ where: { giocatoreId: player.id } });

        // 4. Movimenti Contabili
        await prisma.movimentoContabile.deleteMany({ where: { giocatoreId: player.id } });

        // 5. Giocatore
        await prisma.giocatore.delete({ where: { id: player.id } });

        // 6. User associato
        if (player.userId) {
            await prisma.user.delete({ where: { id: player.userId } });
        }

        console.log('Done.');
    }

    console.log('\n✅ Pulizia completata.');
    await prisma.$disconnect();
}

cleanup().catch(e => {
    console.error('ERRORE:', e);
    process.exit(1);
});
