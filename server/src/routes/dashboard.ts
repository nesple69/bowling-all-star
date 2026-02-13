import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

// Endpoint per la dashboard (pubblico o protetto a seconda delle necessità)
// In questo caso, per consentire la visualizzazione "Visitatore", la rendiamo pubblica
// ma con dati limitati se necessario nel controller (qui ritorniamo dati aggregati/pubblici)
router.get('/stats', getDashboardStats);

export default router;
