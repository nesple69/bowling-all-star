import { Router } from 'express';
import { body } from 'express-validator';
import * as giocatoriController from '../controllers/giocatoriController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Endpoint pubblici (ma richiedono login)
// Endpoint pubblici (Lettura)
router.get('/', giocatoriController.getAllGiocatori);
router.get('/stats', giocatoriController.getGiocatoriStats);
router.get('/:id', giocatoriController.getGiocatoreById);

// Endpoint riservati agli ADMIN
router.post(
    '/',
    authenticateToken,
    isAdmin,
    [
        body('email').isEmail().withMessage('Email valida richiesta'),
        body('nome').notEmpty().withMessage('Nome richiesto'),
        body('cognome').notEmpty().withMessage('Cognome richiesto'),
        body('dataNascita').isISO8601().withMessage('Data di nascita valida richiesta'),
        body('categoria').notEmpty().withMessage('Categoria richiesta')
    ],
    giocatoriController.createGiocatore
);

router.put(
    '/:id',
    authenticateToken,
    isAdmin,
    giocatoriController.updateGiocatore
);

router.delete(
    '/:id',
    authenticateToken,
    isAdmin,
    giocatoriController.deleteGiocatore
);

export default router;
