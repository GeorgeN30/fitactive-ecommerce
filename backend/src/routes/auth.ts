import { Router } from "express";
import { authController } from "../controllers/auth";
import { validateJWT, validateMfaPendingJWT } from "../middlewares/auth";
import { otpRequestLimiter, otpVerifyLimiter, authLimiter } from "../middlewares/rateLimit";

const router = Router();

router.post("/register-request", otpRequestLimiter, authController.requestRegisterOtp);
router.post("/register", authLimiter, authController.register);
router.post("/login-password", authLimiter, authController.loginWithPassword);
router.get("/check-password", authController.checkPassword);
router.post("/otp-request", otpRequestLimiter, authController.requestOtp);
router.post("/otp-verify", otpVerifyLimiter, authController.verifyOtp);
router.post("/google", authController.googleAuth);
router.post("/forgot-password", otpRequestLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);

router.post("/2fa/setup", validateJWT, authController.setup2Fa);
router.post("/2fa/enable", validateJWT, authController.enable2Fa);
router.post("/2fa/verify", validateMfaPendingJWT, authController.verify2Fa);
router.post("/2fa/disable", validateJWT, authController.disable2Fa);

router.get("/me", validateJWT, authController.getMe);
router.post("/set-password", validateJWT, authController.setPassword);
router.post("/change-password", validateJWT, authController.changePassword);
router.post("/request-delete-otp", validateJWT, otpRequestLimiter, authController.requestDeleteOtp);
router.post("/verify-delete-otp", validateJWT, otpVerifyLimiter, authController.verifyDeleteOtp);
router.delete("/account", validateJWT, authController.deleteAccount);

export default router;
