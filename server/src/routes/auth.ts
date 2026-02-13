import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Endpoint per la registrazione (protetto: solo ADMIN può creare nuovi utenti)
router.post(
    '/register',
    authenticateToken,
    isAdmin,
    [
        body('email').isEmail().withMessage('Inserire una email valida'),
        body('password').isLength({ min: 6 }).withMessage('La password deve avere almeno 6 caratteri'),
        body('nome').notEmpty().withMessage('Il nome è richiesto'),
        body('cognome').notEmpty().withMessage('Il cognome è richiesto')
    ],
    authController.register
);

// Login
router.post('/login', authController.login);

// Ottieni profilo utente corrente
router.get('/me', authenticateToken, authController.getMe);

// Aggiorna profilo utente corrente
router.put('/update-profile', authenticateToken, authController.updateProfile);

export default router;
