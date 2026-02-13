import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createFirstAdmin() {
    try {
        const username = 'admin';
        const password = 'admin123'; // ⚠️ CAMBIA SUBITO DOPO IL PRIMO LOGIN
        const nome = 'Amministratore';
        const cognome = 'Sistema';

        // Verifica se esiste già
        const exists = await prisma.user.findUnique({ where: { username } });
        if (exists) {
            console.log('❌ Username "admin" già esistente!');
            console.log('💡 Usa un username diverso o elimina l\'utente esistente.');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                nome,
                cognome,
                ruolo: 'ADMIN',
                email: null
            }
        });

        console.log('\n✅ Primo admin creato con successo!');
        console.log('════════════════════════════════');
        console.log(`📧 Username: ${username}`);
        console.log(`🔑 Password: ${password}`);
        console.log('════════════════════════════════');
        console.log('⚠️  IMPORTANTE: Cambia la password dopo il primo login!\n');
    } catch (error) {
        console.error('❌ Errore durante la creazione dell\'admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createFirstAdmin();
