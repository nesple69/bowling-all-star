import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    const email = 'info@bowlingvaldera.it';
    const password = 'admin_password_2026'; // Da cambiare al primo accesso
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const admin = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
                nome: 'Admin',
                cognome: 'Bowling',
                ruolo: 'ADMIN',
            },
        });

        console.log('Primo utente ADMIN creato:', admin.email);
        console.log('Password temporanea:', password);
    } catch (error) {
        console.error('Errore durante la creazione dell\'admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
