import { Router, Request, Response } from 'express';
import { generaBackupPDF } from '../services/backupService';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const router = Router();
const execAsync = promisify(exec);

// Middleware di autenticazione admin per tutte le rotte
router.use(authenticateToken);
router.use(isAdmin);

/**
 * GET /api/backup/genera/:stagioneId
 * Genera backup PDF per una stagione specifica
 */
router.get('/genera/:stagioneId', async (req: AuthRequest, res: Response) => {
    try {
        const { stagioneId } = req.params;

        if (!stagioneId) {
            return res.status(400).json({ message: 'ID stagione mancante' });
        }

        // Genera il PDF
        const pdfBuffer = await generaBackupPDF(stagioneId as string);

        // Imposta gli headers per il download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="backup-stagione-${stagioneId}-${new Date().toISOString().split('T')[0]}.pdf"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);

        // Invia il PDF
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Errore nella generazione del backup PDF:', error);

        if (error.message === 'Stagione non trovata') {
            return res.status(404).json({ message: 'Stagione non trovata' });
        }

        res.status(500).json({
            message: 'Errore nella generazione del backup PDF',
            error: error.message
        });
    }
});

/**
 * GET /api/backup/database
 * Genera dump completo del database PostgreSQL
 */
router.get('/database', async (req: AuthRequest, res: Response) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `backup-database-${timestamp}.sql`;
        const backupPath = path.join(__dirname, '../../backups', filename);

        // Crea directory backups se non esiste
        const backupsDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        // Ottieni i dettagli di connessione dal DATABASE_URL
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            return res.status(500).json({ message: 'DATABASE_URL non configurato' });
        }

        // Parse DATABASE_URL
        // Formato: postgresql://user:password@host:port/database
        const dbUrl = new URL(databaseUrl);
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';
        const dbName = dbUrl.pathname.substring(1);

        // Costruisci comando pg_dump
        const pgDumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${backupPath}"`;

        // Esegui pg_dump
        await execAsync(pgDumpCommand, {
            env: {
                ...process.env,
                PGPASSWORD: dbPassword
            }
        });

        // Verifica che il file sia stato creato
        if (!fs.existsSync(backupPath)) {
            return res.status(500).json({ message: 'Errore nella creazione del backup' });
        }

        // Leggi il file e invialo
        const fileBuffer = fs.readFileSync(backupPath);

        // Imposta gli headers per il download
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', fileBuffer.length);

        // Invia il file
        res.send(fileBuffer);

        // Elimina il file temporaneo dopo l'invio
        setTimeout(() => {
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }
        }, 5000);

    } catch (error: any) {
        console.error('Errore nel backup del database:', error);

        if (error.message.includes('pg_dump')) {
            return res.status(500).json({
                message: 'pg_dump non trovato. Assicurati che PostgreSQL sia installato e pg_dump sia nel PATH.',
                error: error.message
            });
        }

        res.status(500).json({
            message: 'Errore nel backup del database',
            error: error.message
        });
    }
});

export default router;
