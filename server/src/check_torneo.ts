import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- TORNEI ---');
    const tornei = await prisma.torneo.findMany({
        where: { nome: { contains: 'Campionato Italiano Doppio' } },
        include: { stagione: true }
    });
    console.log(JSON.stringify(tornei, null, 2));

    console.log('\n--- STAGIONE ATTIVA ---');
    const stagioneAttiva = await prisma.stagione.findFirst({
        where: { attiva: true }
    });
    console.log(JSON.stringify(stagioneAttiva, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
