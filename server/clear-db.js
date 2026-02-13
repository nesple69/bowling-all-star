const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Clearing database for new category schema...');

    // Order of deletion to avoid foreign key violations
    await prisma.iscrizioneTorneo.deleteMany();
    await prisma.risultatoTorneo.deleteMany();
    await prisma.movimentoContabile.deleteMany();
    await prisma.saldoBorsellino.deleteMany();

    // Now clear players and users (except admin maybe, but safer to clear all for clean sync)
    const users = await prisma.user.findMany({ where: { ruolo: 'ADMIN' } });

    await prisma.giocatore.deleteMany();
    await prisma.user.deleteMany({ where: { ruolo: 'USER' } });

    console.log('Database cleared successfully.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
