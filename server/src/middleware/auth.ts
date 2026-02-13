import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token mancante' });
    }

    jwt.verify(token, JWT_SECRET, (err, user: any) => {
        if (err) {
            return res.status(403).json({ message: 'Token non valido o scaduto' });
        }
        req.user = user;
        next();
    });
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accesso negato: richiesti privilegi di amministratore' });
    }
    next();
};
