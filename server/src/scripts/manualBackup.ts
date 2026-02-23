import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { generaBackupPDF } from '../services/backupService';

dotenv.config();

const prisma = new PrismaClient();

async function runBackup() {
    console.log('🚀 Avvio processo di backup JSON (Prisma)...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-full-${timestamp}.json`;
    const backupsDir = path.join(__dirname, '../../backups');
    const backupPath = path.join(backupsDir, filename);

    try {
        // 1. Crea directory backups
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
            console.log(`📁 Cartella creata: ${backupsDir}`);
        }

        console.log('📡 Estrazione dati dalle tabelle...');

        // 2. Estrazione dati da ogni tabella
        const backupData: any = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                projectName: 'Bowling App'
            },
            data: {}
        };

        // Elenco tabelle da esportare
        const tables = [
            'user',
            'giocatore',
            'stagione',
            'torneo',
            'giorniOrariTorneo',
            'iscrizioneTorneo',
            'risultatoTorneo',
            'partitaTorneo',
            'movimentoContabile',
            'saldoBorsellino'
        ];

        for (const table of tables) {
            console.log(`  - Esportazione ${table}...`);
            // @ts-ignore - Accediamo dinamicamente alle tabelle di Prisma
            backupData.data[table] = await prisma[table].findMany();
            console.log(`    ✅ ${backupData.data[table].length} record trovati.`);
        }

        // 3. Salvataggio su file
        console.log('💾 Salvataggio su file JSON...');
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        if (fs.existsSync(backupPath)) {
            const stats = fs.statSync(backupPath);
            console.log(`✅ Backup JSON completato con successo!`);
            console.log(`📄 File: ${filename}`);
            console.log(`📏 Dimensione: ${(stats.size / 1024).toFixed(2)} KB`);
        }

        // 4. Generazione PDF Stagione Attiva
        console.log('\n📄 Generazione report PDF stagione attiva...');
        const stagioneAttiva = await prisma.stagione.findFirst({ where: { attiva: true } });

        if (stagioneAttiva) {
            const pdfBuffer = await generaBackupPDF(stagioneAttiva.id);
            const pdfFilename = `report-stagione-${stagioneAttiva.nome.replace(/\s+/g, '-')}-${timestamp}.pdf`;
            const pdfPath = path.join(backupsDir, pdfFilename);

            fs.writeFileSync(pdfPath, pdfBuffer);
            console.log(`✅ Report PDF generato con successo!`);
            console.log(`📄 File: ${pdfFilename}`);
            console.log(`📍 Percorso: ${pdfPath}`);
        } else {
            console.log('⚠️ Nessuna stagione attiva trovata, salto la generazione del PDF.');
        }

    } catch (error: any) {
        console.error('❌ Errore durante il backup JSON:');
        console.error(error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runBackup();
