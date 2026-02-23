import { Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth';

// GET /api/users - Lista tutti gli utenti
export const getAllUsers = async (_req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                nome: true,
                cognome: true,
                ruolo: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero utenti', error });
    }
};

// POST /api/users/create-admin - Crea nuovo admin
export const createAdmin = async (req: AuthRequest, res: Response) => {
    const { username, email, password, nome, cognome } = req.body;

    try {
        // Verifica username univoco
        const exists = await prisma.user.findUnique({ where: { username } });
        if (exists) {
            return res.status(400).json({ message: 'Username già in uso' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await prisma.user.create({
            data: {
                username,
                email: email || null,
                password: hashedPassword,
                nome,
                cognome,
                ruolo: 'ADMIN'
            }
        });

        res.status(201).json({
            message: 'Admin creato con successo',
            user: { id: newAdmin.id, username: newAdmin.username }
        });
    } catch (error) {
        res.status(500).json({ message: 'Errore nella creazione admin', error });
    }
};

// PUT /api/users/:id/role - Cambia ruolo utente
export const updateUserRole = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { ruolo } = req.body;

    try {
        // Verifica che non sia l'ultimo admin
        if (ruolo === 'USER') {
            const adminCount = await prisma.user.count({ where: { ruolo: 'ADMIN' } });
            if (adminCount <= 1) {
                return res.status(400).json({
                    message: 'Impossibile rimuovere l\'ultimo amministratore'
                });
            }
        }

        const updated = await prisma.user.update({
            where: { id: id as string },
            data: { ruolo }
        });

        res.json({ message: 'Ruolo aggiornato', user: updated });
    } catch (error) {
        res.status(500).json({ message: 'Errore nell\'aggiornamento ruolo', error });
    }
};

// DELETE /api/users/:id - Elimina utente
export const deleteUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        // Impedisce eliminazione di se stesso
        if (req.user?.userId === id) {
            return res.status(400).json({ message: 'Non puoi eliminare il tuo stesso account' });
        }

        // Verifica che non sia l'ultimo admin
        const user = await prisma.user.findUnique({ where: { id: id as string } });
        if (user?.ruolo === 'ADMIN') {
            const adminCount = await prisma.user.count({ where: { ruolo: 'ADMIN' } });
            if (adminCount <= 1) {
                return res.status(400).json({
                    message: 'Impossibile eliminare l\'ultimo amministratore'
                });
            }
        }

        await prisma.user.delete({ where: { id: id as string } });
        res.json({ message: 'Utente eliminato con successo' });
    } catch (error) {
        res.status(500).json({ message: 'Errore nell\'eliminazione utente', error });
    }
};
