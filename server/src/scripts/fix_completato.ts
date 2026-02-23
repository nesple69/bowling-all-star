import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    console.log('--- FIX STATO TORNEO ---');
    const res = await prisma.torneo.updateMany({
        where: { nome: 'Campionato Regionale Doppio Misto Toscana' },
        data: { completato: true }
    });
    console.log(`Tornei aggiornati a 'completato': ${res.count}`);
}

fix().finally(() => prisma.$disconnect());
