import { Router } from 'express';
import { logoutController, sendOtpController, verifyOtpController } from '../controllers/authController';

const authRouter = Router();

authRouter.post('/send-otp', sendOtpController);
authRouter.post('/verify-otp', verifyOtpController);
authRouter.post('/logout', logoutController);

export { authRouter };
