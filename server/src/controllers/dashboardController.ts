import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { subDays, addDays } from 'date-fns';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const oggi = new Date();

        // 0. Trova la stagione attiva
        const stagioneAttiva = await prisma.stagione.findFirst({
            where: { attiva: true }
        });

        // 1. Totale iscritti per categoria e sesso
        const statsPerCategoria = await prisma.giocatore.groupBy({
            by: ['categoria', 'sesso'],
            _count: {
                id: true
            }
        });

        // 2. Prossimi 5 impegni (tornei in corso o futuri non completati della stagione attiva)
        const prossimiTornei = await prisma.torneo.findMany({
            where: {
                completato: false,
                stagioneId: stagioneAttiva?.id,
                OR: [
                    { dataFine: { gte: oggi } },
                    { AND: [{ dataFine: null }, { dataInizio: { gte: subDays(oggi, 7) } }] }
                ]
            },
            take: 5,
            orderBy: {
                dataInizio: 'asc'
            },
            include: {
                stagione: true
            }
        });

        // 3. Ultimi 4 tornei completati con top 10 giocatori
        const ultimiTornei = await prisma.torneo.findMany({
            where: {
                completato: true,
                stagioneId: stagioneAttiva?.id
            },
            take: 4,
            orderBy: {
                dataInizio: 'desc'
            },
            include: {
                risultati: {
                    orderBy: {
                        posizione: 'asc'
                    },
                    take: 10,
                    include: {
                        giocatore: {
                            select: {
                                nome: true,
                                cognome: true,
                                categoria: true,
                                sesso: true
                            }
                        }
                    }
                },
                stagione: true
            }
        });

        // 4. Certificati in scadenza (< 20 giorni o già scaduti)
        const limiteScadenza = addDays(oggi, 20);

        const certificatiInScadenza = await prisma.giocatore.findMany({
            where: {
                certificatoMedicoScadenza: {
                    lte: limiteScadenza
                }
            },
            orderBy: {
                certificatoMedicoScadenza: 'asc'
            },
            select: {
                id: true,
                nome: true,
                cognome: true,
                certificatoMedicoScadenza: true
            }
        });

        res.json({
            statsPerCategoria: statsPerCategoria.map(s => ({
                categoria: `${s.sesso}/${s.categoria}`,
                count: s._count.id
            })),
            prossimiTornei,
            ultimiTornei,
            certificatiInScadenza
        });
    } catch (error) {
        console.error('Errore nel recupero delle statistiche dashboard:', error);
        res.status(500).json({ message: 'Errore nel caricamento della dashboard' });
    }
};
