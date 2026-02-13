const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('--- DB DIAGNOSTIC ---');
        const count = await prisma.torneo.count();
        console.log('Total tournaments:', count);

        const tornei = await prisma.torneo.findMany({
            include: { stagione: true }
        });

        tornei.forEach(t => {
            console.log(`Torneo: ${t.nome} (ID: ${t.id}) - Season: ${t.stagione?.nome || 'MISSING!'}`);
        });

        console.log('--- END DIAGNOSTIC ---');
    } catch (err) {
        console.error('DIAGNOSTIC FAILED:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
