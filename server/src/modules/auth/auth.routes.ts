import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

// Auth routes: register, login, logout, session-verify, password recovery.
// Both register and login issue a JWT so the client can immediately use the app.
const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/recover-password', AuthController.recoverPassword);

export default router;
