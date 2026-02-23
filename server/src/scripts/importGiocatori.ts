import { PrismaClient, CategoriaGiocatore, Sesso } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const CSV_PATH = path.join(__dirname, '../../../registro tesserai ALL STAR.csv');

async function main() {
    console.log('--- Inizio Importazione Giocatori ---');

    if (!fs.existsSync(CSV_PATH)) {
        console.error('File CSV non trovato:', CSV_PATH);
        return;
    }

    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    // Rimuovi header
    const dataLines = lines.slice(1);
    let imported = 0;
    let errors = 0;

    for (const line of dataLines) {
        const columns = line.split(';');
        if (columns.length < 5) continue;

        const [tessera, nome, cognome, catRaw, dataNascitaRaw, telefono, email, scadenzaMedicaRaw] = columns.map(c => c?.trim());

        if (!email || !tessera) {
            console.warn(`Salto riga per mancanza dati essenziali (Email o Tessera): ${line}`);
            continue;
        }

        try {
            // 1. Derivazione Sesso e Categoria
            const sesso: Sesso = catRaw.startsWith('M') ? 'M' : 'F';
            let categoria: CategoriaGiocatore = 'D'; // Default

            const catSplitted = catRaw.split('/');
            const catSuf = catSplitted.length > 1 ? catSplitted[1].toUpperCase() : '';

            if (['A', 'AA', 'AAA'].includes(catSuf)) categoria = 'A';
            else if (catSuf === 'B') categoria = 'B';
            else if (catSuf === 'C') categoria = 'C';
            else if (catSuf === 'D') categoria = 'D';
            else if (catSuf === 'ES') categoria = 'ES';
            else if (catSuf === 'DS') categoria = 'DS';

            // 2. Parsificazione Date (DD/MM/YYYY -> Date)
            const parseDate = (dStr: string) => {
                if (!dStr || dStr.trim() === '' || dStr.toLowerCase() === 'no') return null;
                const parts = dStr.split('/');
                if (parts.length !== 3) return null;
                const [d, m, y] = parts;
                const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                return isNaN(date.getTime()) ? null : date;
            };

            const dataNascita = parseDate(dataNascitaRaw) || new Date();
            const scadenzaMedica = parseDate(scadenzaMedicaRaw);

            // 3. Creazione Utente e Giocatore in transazione
            const passwordHashed = await bcrypt.hash(tessera, 10);

            await prisma.$transaction(async (tx) => {
                // Controlla se l'utente esiste già
                const existingUser = await tx.user.findUnique({ where: { email } });
                if (existingUser) {
                    console.log(`Utente ${email} già esistente, salto creation.`);
                    return;
                }

                const user = await tx.user.create({
                    data: {
                        email,
                        password: passwordHashed,
                        nome: nome.toUpperCase(),
                        cognome: cognome.toUpperCase(),
                        ruolo: 'USER',
                        giocatore: {
                            create: {
                                nome: nome.toUpperCase(),
                                cognome: cognome.toUpperCase(),
                                numeroTessera: tessera,
                                dataNascita,
                                telefono,
                                sesso,
                                categoria,
                                certificatoMedicoScadenza: scadenzaMedica,
                                saldo: {
                                    create: {
                                        saldoAttuale: 0
                                    }
                                }
                            }
                        }
                    }
                });
            });

            imported++;
            if (imported % 10 === 0) console.log(`Importati ${imported} giocatori...`);

        } catch (error) {
            console.error(`Errore nell'importazione di ${nome} ${cognome}:`, error);
            errors++;
        }
    }

    console.log(`--- Importazione Completata ---`);
    console.log(`Rusciti: ${imported}`);
    console.log(`Falliti: ${errors}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
