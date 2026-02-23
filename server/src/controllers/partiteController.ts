import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getPartiteByRisultato = async (req: Request, res: Response) => {
    const { risultatoTorneoId } = req.params;

    if (!risultatoTorneoId) {
        return res.status(400).json({
            success: false,
            message: 'ID risultato torneo mancante'
        });
    }

    try {
        const risultato = await prisma.risultatoTorneo.findUnique({
            where: { id: risultatoTorneoId as string },
            include: {
                torneo: {
                    select: {
                        id: true,
                        nome: true,
                        tipologia: true
                    }
                },
                giocatore: {
                    select: {
                        nome: true,
                        cognome: true
                    }
                },
                partite: {
                    select: {
                        numeroPartita: true,
                        birilli: true,
                        data: true
                    },
                    orderBy: {
                        numeroPartita: 'asc'
                    }
                }
            }
        });

        if (!risultato) {
            return res.status(404).json({
                success: false,
                message: 'Risultato torneo non trovato'
            });
        }

        res.json({
            success: true,
            data: {
                torneo: risultato.torneo,
                giocatore: {
                    nome: `${risultato.giocatore.nome} ${risultato.giocatore.cognome}`
                },
                risultatoComplessivo: {
                    posizione: risultato.posizione,
                    totaleBirilli: risultato.totaleBirilli,
                    partiteGiocate: risultato.partiteGiocate
                },
                partite: risultato.partite
            }
        });
    } catch (error) {
        console.error('Errore nel recupero partite:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
};
