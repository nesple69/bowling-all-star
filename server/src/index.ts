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

// Logger middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Rotte
app.use('/api/auth', authRoutes);
app.use('/api/giocatori', giocatoriRoutes);
app.use('/api/tornei', torneiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stagioni', stagioniRoutes);
app.use('/api', contabilitaRoutes);
app.use('/api/import', importRoutes);
app.use('/api/partite', partiteRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/users', usersRoutes);

// Servizio file statici (Locandine)
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Export app for Vercel
export default app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
