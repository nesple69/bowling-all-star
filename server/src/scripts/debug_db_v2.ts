import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
    console.log('=== DIAGNOSTICA TORNEI E STAGIONI ===');

    const stagioni = await prisma.stagione.findMany();
    console.log('Stagioni in DB:', stagioni.length);
    stagioni.forEach(s => console.log(`- ${s.nome} | Attiva: ${s.attiva} | ID: ${s.id}`));

    const tornei = await prisma.torneo.findMany({
        include: {
            stagione: true,
            _count: { select: { risultati: true } }
        }
    });

    console.log('\nTornei in DB:', tornei.length);
    tornei.forEach(t => {
        console.log(`- Nome: ${t.nome}`);
        console.log(`  ID: ${t.id}`);
        console.log(`  Stagione: ${t.stagione?.nome || 'N/A'} (ID: ${t.stagioneId})`);
        console.log(`  Completato: ${t.completato}`);
        console.log(`  Risultati: ${t._count.risultati}`);
        console.log('---');
    });
}

debug().finally(() => prisma.$disconnect());
