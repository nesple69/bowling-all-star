import { Router } from 'express';
import * as usersController from '../controllers/usersController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Tutte le routes protette: solo ADMIN
router.get('/', authenticateToken, isAdmin, usersController.getAllUsers);
router.post('/create-admin', authenticateToken, isAdmin, usersController.createAdmin);
router.put('/:id/role', authenticateToken, isAdmin, usersController.updateUserRole);
router.delete('/:id', authenticateToken, isAdmin, usersController.deleteUser);

export default router;
