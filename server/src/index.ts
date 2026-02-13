import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import giocatoriRoutes from './routes/giocatori';
import torneiRoutes from './routes/tornei';
import dashboardRoutes from './routes/dashboard';
import stagioniRoutes from './routes/stagioni';
import contabilitaRoutes from './routes/contabilita';
import importRoutes from './routes/import';
import partiteRoutes from './routes/partite';
import backupRoutes from './routes/backup';
import usersRoutes from './routes/users';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Logger middleware avanzato per Vercel
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
    next();
});

// Rotte - Supporto doppio prefisso per Vercel
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/giocatori', giocatoriRoutes);
apiRouter.use('/tornei', torneiRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/stagioni', stagioniRoutes);
apiRouter.use('/import', importRoutes);
apiRouter.use('/partite', partiteRoutes);
apiRouter.use('/backup', backupRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/', contabilitaRoutes);

// Applichiamo il router sia a /api che alla radice per massima compatibilità
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Servizio file statici (Locandine)
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
    console.log('💚 Health check hit!');
    res.json({ status: 'ok', environment: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

// Gestore 404 personalizzato per debug
app.use('/api/*', (req, res) => {
    console.warn(`⚠️ 404 su rotta API: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Rotta API non trovata',
        path: req.url,
        method: req.method,
        help: 'Se vedi questo, Express è attivo ma la rotta è sbagliata'
    });
});

// Export app for Vercel
export default app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
