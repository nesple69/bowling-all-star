import { Request, Response } from 'express';
import { TipoMovimento, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// GET /api/giocatori/:id/borsellino
export const getBorsellinoGiocatore = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const soloAttiva = req.query.soloAttiva === 'true' || req.query.soloAttiva === '1';

    try {
        const saldo = await prisma.saldoBorsellino.findUnique({
            where: { giocatoreId: id }
        });

        let whereClause: any = { giocatoreId: id };

        if (soloAttiva) {
            const stagioneAttiva = await prisma.stagione.findFirst({
                where: { attiva: true }
            });
            if (stagioneAttiva) {
                whereClause.data = {
                    gte: stagioneAttiva.dataInizio,
                    lte: stagioneAttiva.dataFine
                };
            }
        }

        const movimenti = await prisma.movimentoContabile.findMany({
            where: whereClause,
            orderBy: { data: 'desc' },
            take: soloAttiva ? undefined : 50
        });

        res.json({
            saldo: saldo?.saldoAttuale || 0,
            movimenti
        });
    } catch (error) {
        console.error('Errore recupero borsellino:', error);
        res.status(500).json({ message: 'Errore nel recupero dei dati del borsellino' });
    }
};

// POST /api/contabilita/ricarica
export const ricaricaBorsellino = async (req: Request, res: Response) => {
    const { giocatoreId, importo, descrizione, data: customData } = req.body;
    const adminId = (req as any).user?.id; // Presunto dall'autenticazione

    if (!importo || parseFloat(importo) <= 0) {
        return res.status(400).json({ message: 'L\'importo della ricarica deve essere positivo' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Crea il movimento
            const movimento = await tx.movimentoContabile.create({
                data: {
                    giocatoreId,
                    importo: parseFloat(importo),
                    tipo: TipoMovimento.RICARICA,
                    descrizione: descrizione || 'Ricarica manuale admin',
                    adminId,
                    data: customData ? new Date(customData) : undefined
                }
            });

            // 2. Aggiorna il saldo
            const saldo = await tx.saldoBorsellino.upsert({
                where: { giocatoreId },
                update: {
                    saldoAttuale: { increment: parseFloat(importo) }
                },
                create: {
                    giocatoreId,
                    saldoAttuale: parseFloat(importo)
                }
            });

            return { movimento, saldo };
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Errore ricarica:', error);
        res.status(500).json({ message: 'Errore durante la ricarica del borsellino' });
    }
};

// POST /api/contabilita/addebito
export const addebitoManuale = async (req: Request, res: Response) => {
    const { giocatoreId, importo, descrizione, data: customData } = req.body;
    const adminId = (req as any).user?.id;

    if (!importo || parseFloat(importo) <= 0) {
        return res.status(400).json({ message: 'L\'importo dell\'addebito deve essere positivo' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Verifichiamo se il giocatore ha saldo sufficiente (opzionale, ma consigliato)
            const saldoAttuale = await tx.saldoBorsellino.findUnique({
                where: { giocatoreId }
            });

            // Permettiamo il saldo negativo? In molte associazioni si preferisce di no.
            // Se si vuole impedire il saldo negativo, scommentare le righe sotto:
            /*
            if (!saldoAttuale || saldoAttuale.saldoAttuale.toNumber() < parseFloat(importo)) {
                throw new Error('Saldo insufficiente');
            }
            */

            // 1. Crea il movimento (importo salvato come negativo o positivo?)
            // Solitamente si salva l'importo assoluto e il tipo determina il segno, 
            // oppure lo salviamo negativo. Vedendo lo schema, è Decimal.
            // Facciamo che l'importo salvato nel movimento è quello "nominale".
            const movimento = await tx.movimentoContabile.create({
                data: {
                    giocatoreId,
                    importo: parseFloat(importo), // Lo salviamo come valore positivo, il tipo ADDEBITO indica la sottrazione
                    tipo: TipoMovimento.ADDEBITO_MANUALE,
                    descrizione: descrizione || 'Addebito manuale admin',
                    adminId,
                    data: customData ? new Date(customData) : undefined
                }
            });

            // 2. Aggiorna il saldo (decremento)
            const saldo = await tx.saldoBorsellino.upsert({
                where: { giocatoreId },
                update: {
                    saldoAttuale: { decrement: parseFloat(importo) }
                },
                create: {
                    giocatoreId,
                    saldoAttuale: -parseFloat(importo)
                }
            });

            return { movimento, saldo };
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Errore addebito:', error);
        if (error.message === 'Saldo insufficiente') {
            return res.status(400).json({ message: 'Saldo insufficiente per completare l\'operazione' });
        }
        res.status(500).json({ message: 'Errore durante l\'addebito manuale' });
    }
};

// POST /api/contabilita/rimborso
export const registraRimborso = async (req: Request, res: Response) => {
    const { giocatoreId, importo, descrizione, data: customData } = req.body;
    const adminId = (req as any).user?.id;

    if (!importo || parseFloat(importo) <= 0) {
        return res.status(400).json({ message: 'L\'importo del rimborso deve essere positivo' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Crea il movimento
            // NOTA: Il rimborso è un movimento di storico e non intacca il `saldoAttuale` del giocatore
            const movimento = await tx.movimentoContabile.create({
                data: {
                    giocatoreId,
                    importo: parseFloat(importo),
                    tipo: TipoMovimento.RIMBORSO,
                    descrizione: descrizione || 'Rimborso spese',
                    adminId,
                    data: customData ? new Date(customData) : undefined
                }
            });

            // 2. Fetch the current saldo without modifying it
            const saldo = await tx.saldoBorsellino.findUnique({
                where: { giocatoreId }
            });

            return { movimento, saldo };
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Errore registrazione rimborso:', error);
        res.status(500).json({ message: 'Errore durante la registrazione del rimborso' });
    }
};

// GET /api/contabilita/movimenti
export const getAllMovimenti = async (req: Request, res: Response) => {
    try {
        const movimenti = await prisma.movimentoContabile.findMany({
            include: {
                giocatore: {
                    select: {
                        nome: true,
                        cognome: true,
                        numeroTessera: true
                    }
                }
            },
            orderBy: { data: 'desc' },
            take: 100
        });

        res.json(movimenti);
    } catch (error) {
        console.error('Errore recupero movimenti:', error);
        res.status(500).json({ message: 'Errore nel recupero dello storico movimenti' });
    }
};
// GET /api/contabilita/saldi
export const getAllSaldi = async (req: Request, res: Response) => {
    try {
        const saldi = await prisma.giocatore.findMany({
            select: {
                id: true,
                nome: true,
                cognome: true,
                numeroTessera: true,
                telefono: true,
                saldo: {
                    select: {
                        saldoAttuale: true
                    }
                }
            },
            orderBy: [
                { cognome: 'asc' },
                { nome: 'asc' }
            ]
        });

        // Formattiamo la risposta per appiattire il saldo
        const result = saldi.map(g => ({
            id: g.id,
            nome: g.nome,
            cognome: g.cognome,
            numeroTessera: g.numeroTessera,
            telefono: g.telefono,
            saldoAttuale: g.saldo?.saldoAttuale || 0
        }));

        res.json(result);
    } catch (error) {
        console.error('Errore recupero saldi:', error);
        res.status(500).json({ message: 'Errore nel recupero dei saldi dei giocatori' });
    }
};

export const fixDbEnum = async (req: Request, res: Response) => {
    try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "TipoMovimento" ADD VALUE IF NOT EXISTS 'RIMBORSO';`);
        res.json({ message: 'Enum TipoMovimento aggiornato con successo: RIMBORSO' });
    } catch (error: any) {
        console.error('Errore fixDbEnum:', error);
        res.status(500).json({ message: 'Errore', error: error.message });
    }
};

// Helper per ricalcolare il saldo di un giocatore basandosi sui movimenti
const recalculateSaldo = async (giocatoreId: string, tx: Prisma.TransactionClient) => {
    // Sommiamo tutti i movimenti: RICARICA è +, gli altri sono -
    const movimenti = await tx.movimentoContabile.findMany({
        where: { giocatoreId }
    });

    const nuovoSaldo = movimenti.reduce((acc, m) => {
        const importo = Number(m.importo);
        if (m.tipo === TipoMovimento.RIMBORSO) {
            return acc; // Rimborso non intacca il saldo virtuale
        } else if (m.tipo === TipoMovimento.RICARICA) {
            return acc + importo;
        } else {
            return acc - importo;
        }
    }, 0);

    await tx.saldoBorsellino.upsert({
        where: { giocatoreId },
        update: { saldoAttuale: nuovoSaldo },
        create: { giocatoreId, saldoAttuale: nuovoSaldo }
    });

    return nuovoSaldo;
};

// PUT /api/contabilita/movimenti/:id
export const updateMovimento = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { importo, tipo, descrizione, data } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Trova il movimento esistente per sapere di chi è
            const movimentoEsistente = await tx.movimentoContabile.findUnique({
                where: { id }
            });

            if (!movimentoEsistente) {
                throw new Error('Movimento non trovato');
            }

            // 2. Aggiorna il movimento
            const movimentoAggiornato = await tx.movimentoContabile.update({
                where: { id },
                data: {
                    importo: importo !== undefined ? parseFloat(importo) : undefined,
                    tipo: tipo || undefined,
                    descrizione: descrizione || undefined,
                    data: data ? new Date(data) : undefined
                }
            });

            // 3. Ricalcola il saldo per quel giocatore
            const nuovoSaldo = await recalculateSaldo(movimentoEsistente.giocatoreId, tx);

            return { movimento: movimentoAggiornato, saldo: nuovoSaldo };
        });

        res.json(result);
    } catch (error: any) {
        console.error('Errore aggiornamento movimento:', error);
        if (error.message === 'Movimento non trovato') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Errore durante l\'aggiornamento del movimento' });
    }
};

// DELETE /api/contabilita/movimenti/:id
export const deleteMovimento = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Trova il movimento esistente
            const movimentoEsistente = await tx.movimentoContabile.findUnique({
                where: { id }
            });

            if (!movimentoEsistente) {
                throw new Error('Movimento non trovato');
            }

            const giocatoreId = movimentoEsistente.giocatoreId;

            // 2. Elimina il movimento
            await tx.movimentoContabile.delete({
                where: { id }
            });

            // 3. Ricalcola il saldo
            const nuovoSaldo = await recalculateSaldo(giocatoreId, tx);

            return { success: true, saldo: nuovoSaldo };
        });

        res.json(result);
    } catch (error: any) {
        console.error('Errore eliminazione movimento:', error);
        if (error.message === 'Movimento non trovato') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Errore durante l\'eliminazione del movimento' });
    }
};
