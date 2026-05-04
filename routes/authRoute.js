import express from "express";
import { loginController, otpVerifyController, signupController } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";


const authRoute = express.Router();


authRoute.post("/signup", signupController);
authRoute.post("/login", authMiddleware, loginController)
authRoute.post("/verify-otp", otpVerifyController)




export default authRoute;