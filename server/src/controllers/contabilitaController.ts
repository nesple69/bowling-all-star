import { Request, Response } from 'express';
import { PrismaClient, TipoMovimento } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/giocatori/:id/borsellino
export const getBorsellinoGiocatore = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    try {
        const saldo = await prisma.saldoBorsellino.findUnique({
            where: { giocatoreId: id }
        });

        const movimenti = await prisma.movimentoContabile.findMany({
            where: { giocatoreId: id },
            orderBy: { data: 'desc' },
            take: 50
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
    const { giocatoreId, importo, descrizione } = req.body;
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
                    adminId
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
    const { giocatoreId, importo, descrizione } = req.body;
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
                    adminId
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
