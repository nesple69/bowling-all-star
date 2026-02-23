import { Router } from 'express';
import * as importController from '../controllers/importController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Tutte le rotte di importazione sono riservate agli ADMIN
router.use(authenticateToken, isAdmin);

/**
 * @route   GET /api/import/preview
 * @desc    Ottiene un'anteprima dei dati dal sito FISB
 * @access  Admin
 */
router.get('/preview', importController.getPreview);

/**
 * @route   POST /api/import/torneo
 * @desc    Esegue lo scraping e salva i risultati nel database
 * @access  Admin
 */
router.post('/torneo', importController.importTorneoData);

export default router;
