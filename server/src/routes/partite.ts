import { Router } from 'express';
import { getPartiteByRisultato } from '../controllers/partiteController';

const router = Router();

// GET /api/partite/torneo/:risultatoTorneoId
router.get('/torneo/:risultatoTorneoId', getPartiteByRisultato);

export default router;
