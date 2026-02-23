import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        select: {
            username: true,
            ruolo: true,
            nome: true,
            cognome: true
        }
    });

    console.log('--- UTENTI NEL DB ---');
    users.forEach(u => {
        console.log(`- ${u.username} (${u.ruolo}) - ${u.nome} ${u.cognome}`);
    });
    console.log('--- FINE LISTA ---');
    await prisma.$disconnect();
}

checkUsers().catch(console.error);
