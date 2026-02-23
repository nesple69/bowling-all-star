import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Inizializzazione database...');

    // 1. Crea Stagione
    const stagione = await prisma.stagione.upsert({
        where: { id: 'current-season' }, // Usiamo un ID fisso per semplicità o cerchiamo per nome
        update: { attiva: true },
        create: {
            id: 'current-season',
            nome: 'Stagione 2024-2025',
            dataInizio: new Date('2024-09-01'),
            dataFine: new Date('2025-08-31'),
            attiva: true
        }
    });
    console.log(`✅ Stagione attiva: ${stagione.nome}`);

    // 2. Crea o Aggiorna Admin (con password hashata correttamente)
    const hashedPassword = await bcrypt.hash('Bowling2026!', 10);
    const adminGeneral = await prisma.user.upsert({
        where: { username: 'admin' },
        update: { password: hashedPassword, ruolo: 'ADMIN' },
        create: {
            username: 'admin',
            password: hashedPassword,
            ruolo: 'ADMIN',
            nome: 'Amministratore',
            cognome: 'Sistema',
            email: 'admin@system.local'
        }
    });

    // 2b. Crea o Aggiorna Admin Utente (da backup)
    const userHashedPassword = await bcrypt.hash('admin_password_2026', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'info@bowlingvaldera.it' },
        update: { password: userHashedPassword, ruolo: 'ADMIN' },
        create: {
            username: 'info_admin',
            email: 'info@bowlingvaldera.it',
            password: userHashedPassword,
            ruolo: 'ADMIN',
            nome: 'Admin',
            cognome: 'Bowling'
        }
    });

    console.log('✅ Utenti admin pronti:');
    console.log('- username: admin, password: Bowling2026!');
    console.log('- email: info@bowlingvaldera.it, password: admin_password_2026');

    await prisma.$disconnect();
}

seed().catch(console.error);
