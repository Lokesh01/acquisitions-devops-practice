import { signin, signOut, signup } from '#src/controllers/auth.controller.js';
import express from 'express';

const router = express.Router();

router.post('/sign-up', signup);

router.post('/sign-in', signin);

router.post('/sign-out', signOut);

export default router;
