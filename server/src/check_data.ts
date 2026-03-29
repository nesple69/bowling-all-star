import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STAGIONI ---');
    const stagioni = await prisma.stagione.findMany();
    console.table(stagioni.map(s => ({ id: s.id, nome: s.nome, attiva: s.attiva })));

    console.log('\n--- TORNEI (NON COMPLETATI) ---');
    const tornei = await prisma.torneo.findMany({
        where: { completato: false },
        include: { stagione: true },
        orderBy: { dataInizio: 'desc' },
        take: 10
    });
    console.table(tornei.map(t => ({
        id: t.id,
        nome: t.nome,
        dataInizio: t.dataInizio,
        dataFine: t.dataFine,
        stagione: t.stagione.nome,
        stagioneAttiva: t.stagione.attiva,
        completato: t.completato
    })));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
