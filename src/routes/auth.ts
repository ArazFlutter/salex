import { Router } from 'express';
import { logoutController, sendOtpController, verifyOtpController, directRegisterController } from '../controllers/authController';

const authRouter = Router();

authRouter.post('/send-otp', sendOtpController);
authRouter.post('/verify-otp', verifyOtpController);
authRouter.post('/direct-register', directRegisterController);
authRouter.post('/logout', logoutController);

export { authRouter };
