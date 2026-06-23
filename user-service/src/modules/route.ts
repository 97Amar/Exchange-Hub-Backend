import express, { Router } from "express";
import { sendOtpRateLimiter } from "../middleware/rateLimiter.middleware";
import * as authValidations from "./user/auth.validation";
import * as authController from "./user/auth.controller";

import * as profileController from "./user/profile.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

interface Route {
  router: Router;
}

class UserRouter implements Route {
  public router = Router();
  private basePath = "/v1/user";

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /signup_with_password:
     *   post:
     *     summary: Sign up with password
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *               confirmPassword:
     *                 type: string
     *               deviceType:
     *                 type: string
     *               type:
     *                 type: string
     *     responses:
     *       200:
     *         description: OTP sent successfully
     *       400:
     *         description: Validation error
     */
    this.router.post(
      "/signup_with_password",
      sendOtpRateLimiter,
      validate(authValidations.signUpWithPassword),
      authController.signUPWithPassword, // Exported correctly as signUPWithPassword
    );

    /**
     * @swagger
     * /verify_otp:
     *   post:
     *     summary: Verify OTP
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               otp:
     *                 type: string
     *     responses:
     *       200:
     *         description: OTP verified successfully
     *       400:
     *         description: Invalid OTP
     */
    this.router.post(
      "/verify_otp",
      validate(authValidations.verifyOtp),
      authController.verifyOTP,
    );

    /**
     * @swagger
     * /send_otp:
     *   post:
     *     summary: Send logic for OTP
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               type:
     *                 type: string
     *     responses:
     *       200:
     *         description: OTP sent successfully
     *       400:
     *         description: Validation error
     */
    this.router.post(
      "/send_otp",
      sendOtpRateLimiter,
      validate(authValidations.sendOtp),
      authController.sendOTP,
    );

    this.router.post(
      "/login",
      validate(authValidations.login),
      authController.login,
    );


    this.router.post(
      "/logout",
      authenticate,
      authController.logout,
    );

    this.router.get(
      "/get-my-profile",
      authenticate,
      profileController.getMyProfile,
    );

    this.router.put(
      "/update-profile",
      authenticate,
      upload.single("profile_pic"),
      profileController.updateMyProfile,
    );
  }
}

export default UserRouter;
