import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase Storage Safe
const getSupabaseClient = () => {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('[SUPABASE] Errore: Variabili SUPABASE_URL o KEY mancanti su Vercel!');
        return null;
    }
    return createClient(url, key);
};

const supabase = getSupabaseClient();

// Configurazione Multer per caricamento Locandine (In Memoria per Vercel/Supabase)
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato file non supportato. Caricare PDF o immagini.'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/tornei/public
export const getTorneiPublici = async (_req: Request, res: Response) => {
    try {
        const tornei = await prisma.torneo.findMany({
            include: {
                turni: true,
                stagione: true
            },
            orderBy: {
                dataInizio: 'desc'
            }
        });
        res.json(tornei);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero dei tornei', error });
    }
};

// GET /api/tornei/public/:id
export const getTorneoPublicById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const torneo = await prisma.torneo.findUnique({
            where: { id },
            include: {
                stagione: true,
                turni: {
                    orderBy: { orarioInizio: 'asc' }
                },
                risultati: {
                    include: {
                        giocatore: {
                            select: { nome: true, cognome: true, sesso: true, categoria: true }
                        },
                        partite: {
                            orderBy: { numeroPartita: 'asc' }
                        }
                    },
                    orderBy: [
                        { isRiserva: 'asc' },
                        { posizione: 'asc' }
                    ]
                }
            }
        });

        if (!torneo) {
            return res.status(404).json({ message: 'Torneo non trovato' });
        }

        res.json(torneo);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero del torneo', error });
    }
};

// GET /api/tornei (solo ADMIN - lista filtrata per stagione)
export const getTorneiAdmin = async (req: Request, res: Response) => {
    const { stagioneId } = req.query;
    console.log('GET /api/tornei (Admin) - stagioneId:', stagioneId);
    try {
        const tornei = await prisma.torneo.findMany({
            where: stagioneId ? { stagioneId: stagioneId as string } : {},
            include: {
                _count: {
                    select: { iscrizioni: true, risultati: true }
                },
                stagione: true
            },
            orderBy: { dataInizio: 'desc' }
        });
        res.json(tornei);
    } catch (error) {
        console.error('SERVER ERROR (getTorneiAdmin):', error);
        res.status(500).json({ message: 'Errore nel recupero dei tornei admin', error: String(error) });
    }
};

// GET /api/tornei/:id (dettaglio con giorni/orari)
export const getTorneoById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const torneo = await prisma.torneo.findUnique({
            where: { id },
            include: {
                turni: {
                    orderBy: { giorno: 'asc' }
                },
                stagione: true
            }
        });
        if (!torneo) return res.status(404).json({ message: 'Torneo non trovato' });
        res.json(torneo);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero del dettaglio torneo', error });
    }
};

// POST /api/tornei (crea torneo)
export const createTorneo = async (req: Request, res: Response) => {
    console.log('--- CREATE TORNEO START ---');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const { nome, tipologia, sede, stagioneId, dataInizio, dataFine, linkIscrizione, costoIscrizione, mostraBottoneIscrizione, locandinaUrl } = req.body;
    let locandina = locandinaUrl || null;

    try {
        // Gestione caricamento su Supabase Storage se presente un file
        if (req.file) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `locandina-${uniqueSuffix}${path.extname(req.file.originalname)}`;

            console.log(`[SUPABASE] Caricamento file: ${fileName}`);

            if (!supabase) {
                console.error('[SUPABASE] Errore: Tentativo di upload senza client configurato!');
                throw new Error('Configurazione Supabase mancante sul server.');
            }

            const { data, error } = await supabase.storage
                .from('locandine')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true
                });

            if (data && !error) {
                const { data: { publicUrl } } = supabase.storage
                    .from('locandine')
                    .getPublicUrl(fileName);
                locandina = publicUrl;
                console.log(`[SUPABASE] Caricamento completato: ${locandina}`);
            } else {
                console.error('[SUPABASE ERROR] Errore caricamento storage:', error);
                throw new Error(`Errore Supabase: ${error.message} (${error.statusCode || error.code || 'N/A'})`);
            }
        }
        const dataInizioParsed = dataInizio ? new Date(dataInizio) : null;
        if (!dataInizioParsed || isNaN(dataInizioParsed.getTime())) {
            throw new Error('Data inizio non valida');
        }

        const dataFineParsed = dataFine ? new Date(dataFine) : null;

        const nuovoTorneo = await prisma.torneo.create({
            data: {
                nome,
                tipologia,
                sede,
                locandina,
                linkIscrizione,
                stagioneId,
                costoIscrizione: costoIscrizione ? parseFloat(costoIscrizione) : 0,
                dataInizio: dataInizioParsed,
                dataFine: dataFineParsed,
                mostraBottoneIscrizione: mostraBottoneIscrizione === 'false' || mostraBottoneIscrizione === false ? false : true
            }
        });
        console.log('Torneo creato con successo:', nuovoTorneo.id);
        res.status(201).json(nuovoTorneo);
    } catch (error: any) {
        console.error('SERVER ERROR (createTorneo):', error);
        res.status(500).json({
            message: 'Errore nella creazione del torneo',
            error: error.message || String(error)
        });
    }
};

// PUT /api/tornei/:id (modifica)
export const updateTorneo = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    console.log(`--- UPDATE TORNEO START (ID: ${id}) ---`);
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const { nome, tipologia, sede, stagioneId, dataInizio, dataFine, linkIscrizione, completato, costoIscrizione, mostraBottoneIscrizione, locandinaUrl } = req.body;
    let locandina = locandinaUrl || undefined;

    try {
        // Gestione caricamento su Supabase Storage se presente un file
        if (req.file) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `locandina-${uniqueSuffix}${path.extname(req.file.originalname)}`;

            console.log(`[SUPABASE] Aggiornamento file: ${fileName}`);

            if (!supabase) {
                console.error('[SUPABASE] Errore: Tentativo di upload senza client configurato!');
                throw new Error('Configurazione Supabase mancante sul server.');
            }

            const { data, error } = await supabase.storage
                .from('locandine')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true
                });

            if (data && !error) {
                const { data: { publicUrl } } = supabase.storage
                    .from('locandine')
                    .getPublicUrl(fileName);
                locandina = publicUrl;
                console.log(`[SUPABASE] Caricamento completato: ${locandina}`);
            } else {
                console.error('[SUPABASE ERROR] Errore caricamento storage:', error);
                throw new Error(`Errore Supabase: ${error.message} (${error.statusCode || error.code || 'N/A'})`);
            }
        }
        const dataInizioParsed = dataInizio ? new Date(dataInizio) : undefined;
        if (dataInizioParsed !== undefined && isNaN(dataInizioParsed.getTime())) {
            throw new Error('Data inizio non valida');
        }

        const dataFineParsed = dataFine ? new Date(dataFine) : null;

        const updateData: any = {
            nome,
            tipologia,
            sede,
            stagioneId,
            dataInizio: dataInizioParsed,
            dataFine: dataFineParsed,
            linkIscrizione,
            costoIscrizione: costoIscrizione !== undefined ? (parseFloat(costoIscrizione) || 0) : undefined,
            completato: completato === 'true' || completato === true,
            mostraBottoneIscrizione: mostraBottoneIscrizione === 'false' || mostraBottoneIscrizione === false ? false : true
        };
        if (locandina) updateData.locandina = locandina;

        const torneoAggiornato = await prisma.torneo.update({
            where: { id },
            data: updateData
        });
        console.log('Torneo aggiornato con successo');
        res.json(torneoAggiornato);
    } catch (error: any) {
        console.error('SERVER ERROR (updateTorneo):', error);
        res.status(500).json({
            message: 'Errore nell\'aggiornamento del torneo',
            error: error.message || String(error)
        });
    }
};

// DELETE /api/tornei/:id
export const deleteTorneo = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        // Eseguiamo tutto in una transazione per sicurezza
        await prisma.$transaction([
            prisma.iscrizioneTorneo.deleteMany({ where: { torneoId: id } }),
            prisma.risultatoTorneo.deleteMany({ where: { torneoId: id } }),
            prisma.giorniOrariTorneo.deleteMany({ where: { torneoId: id } }),
            prisma.torneo.delete({ where: { id } })
        ]);
        res.json({ message: 'Torneo e tutti i dati associati eliminati con successo' });
    } catch (error) {
        console.error('Errore durante l\'eliminazione del torneo:', error);
        res.status(500).json({ message: 'Errore nell\'eliminazione del torneo', error: String(error) });
    }
};

// POST /api/tornei/:id/giorni (aggiungi giorno/orario disponibile)
export const addGiornoTorneo = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { giorno, orarioInizio, orarioFine, postiDisponibili } = req.body;

    try {
        const nuovoGiorno = await prisma.giorniOrariTorneo.create({
            data: {
                torneoId: id,
                giorno: new Date(giorno),
                orarioInizio: new Date(orarioInizio),
                orarioFine: new Date(orarioFine),
                postiDisponibili: parseInt(postiDisponibili)
            }
        });
        res.status(201).json(nuovoGiorno);
    } catch (error) {
        res.status(500).json({ message: 'Errore nell\'aggiunta del giorno/orario', error });
    }
};

// PUT /api/tornei/:id/giorni/:giornoId (solo ADMIN)
export const updateGiornoTorneo = async (req: Request, res: Response) => {
    const giornoId = req.params.giornoId as string;
    const { giorno, orarioInizio, orarioFine, postiDisponibili } = req.body;

    try {
        const giornoAggiornato = await prisma.giorniOrariTorneo.update({
            where: { id: giornoId },
            data: {
                giorno: new Date(giorno),
                orarioInizio: new Date(orarioInizio),
                orarioFine: new Date(orarioFine),
                postiDisponibili: parseInt(postiDisponibili)
            }
        });
        res.json(giornoAggiornato);
    } catch (error) {
        res.status(500).json({ message: 'Errore nell\'aggiornamento del giorno/orario', error });
    }
};

// DELETE /api/tornei/:id/giorni/:giornoId
export const deleteGiornoTorneo = async (req: Request, res: Response) => {
    const giornoId = req.params.giornoId as string;
    try {
        await prisma.giorniOrariTorneo.delete({
            where: { id: giornoId }
        });
        res.json({ message: 'Giorno/orario eliminato con successo' });
    } catch (error) {
        res.status(500).json({ message: 'Errore nell\'eliminazione del giorno/orario', error });
    }
};

// GET /api/tornei/classifiche
export const getClassifiche = async (_req: Request, res: Response) => {
    try {
        const classifiche = await prisma.torneo.findMany({
            where: { completato: true },
            include: {
                risultati: {
                    include: {
                        giocatore: {
                            select: { nome: true, cognome: true, categoria: true }
                        }
                    },
                    orderBy: [
                        { isRiserva: 'asc' },
                        { posizione: 'asc' }
                    ]
                },
                stagione: true
            },
            orderBy: { dataFine: 'desc' },
            take: 10
        });
        res.json(classifiche);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero delle classifiche', error });
    }
};

// GET /api/tornei/:id/risultati (solo ADMIN)
export const getRisultatiTorneoAdmin = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const risultati = await prisma.risultatoTorneo.findMany({
            where: { torneoId: id },
            include: {
                giocatore: {
                    select: { nome: true, cognome: true, categoria: true }
                }
            },
            orderBy: [
                { isRiserva: 'asc' },
                { posizione: 'asc' }
            ]
        });
        res.json(risultati);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero dei risultati', error });
    }
};

// POST /api/tornei/:id/risultati (solo ADMIN - upsert singolo risultato)
export const upsertRisultato = async (req: Request, res: Response) => {
    const torneoId = req.params.id as string;
    const { giocatoreId, posizione, partiteGiocate, totaleBirilli, totaleBirilliSquadra, isRiserva, partite } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const risultato = await tx.risultatoTorneo.upsert({
                where: {
                    id: req.body.id || 'new-id'
                },
                update: {
                    posizione: parseInt(posizione),
                    partiteGiocate: parseInt(partiteGiocate),
                    totaleBirilli: parseInt(totaleBirilli),
                    totaleBirilliSquadra: totaleBirilliSquadra ? parseInt(totaleBirilliSquadra) : null,
                    isRiserva: isRiserva === true || isRiserva === 'true'
                },
                create: {
                    torneoId,
                    giocatoreId,
                    posizione: parseInt(posizione),
                    partiteGiocate: parseInt(partiteGiocate),
                    totaleBirilli: parseInt(totaleBirilli),
                    totaleBirilliSquadra: totaleBirilliSquadra ? parseInt(totaleBirilliSquadra) : null,
                    isRiserva: isRiserva === true || isRiserva === 'true'
                }
            });

            // Gestione partite se fornite
            if (partite && Array.isArray(partite)) {
                // Rimuovi vecchie partite per questo risultato
                await tx.partitaTorneo.deleteMany({
                    where: { risultatoTorneoId: risultato.id }
                });

                // Inserisci nuove partite
                if (partite.length > 0) {
                    await tx.partitaTorneo.createMany({
                        data: partite.map((p: number, index: number) => ({
                            risultatoTorneoId: risultato.id,
                            numeroPartita: index + 1,
                            birilli: p,
                            data: new Date()
                        }))
                    });
                }
            }

            return risultato;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore nel salvataggio del risultato', error });
    }
};

// DELETE /api/tornei/:id/risultati/:risultatoId (solo ADMIN)
export const deleteRisultato = async (req: Request, res: Response) => {
    const risultatoId = req.params.risultatoId as string;
    try {
        await prisma.risultatoTorneo.delete({ where: { id: risultatoId } });
        res.json({ message: 'Risultato eliminato' });
    } catch (error) {
        res.status(500).json({ message: 'Errore nell\'eliminazione del risultato', error });
    }
};
