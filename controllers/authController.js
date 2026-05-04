import UserModel from "../models/UserModel.js";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OtpModel from "../models/OtpModel.js";

export const signupController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name, !email, !password) {
      return res.status(400).json({
        message: "required fields are missing",
        status: false
      })
    }

    const user = await UserModel.findOne({ email });

    if (user) {
      return res.status(400).json({
        message: "email address already exists",
        status: false
      })
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const body = {
      ...req.body,
      password: hashPassword
    };

    await UserModel.create(body);

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASS
      }
    });

    const otp = uuidv4().slice(0, 6);

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Verification Email",
      html: `
            <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>

  <style>
    *{
      margin: 0; 
      padding: 0; 
      box-sizing: border-box;
      font-family: "Poppins", sans-serif;
    }

    body{
      background: #f5f7fa;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      padding: 20px;
    }

    .card{
      background: #ffffff;
      width: 100%;
      max-width: 400px;
      padding: 32px 28px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 8px 25px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
      animation: fadeUp .6s ease;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    h2{
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
    }

    p{
      font-size: 14px;
      color: #475569;
      margin-bottom: 22px;
    }

    .otp-box{
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 18px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .otp{
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 6px;
      color: #0f172a;
    }

    footer{
      margin-top: 25px;
      font-size: 13px;
      color: #64748b;
      text-align: center;
    }

    footer a{
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }

    footer a:hover{
      text-decoration: underline;
    }

  </style>
</head>
<body>

  <div class="card">
    <h2>Verify Your Email</h2>
    <p>Enter the OTP below to verify your email address.</p>

    <div class="otp-box">
      <div class="otp" id="otpValue">${otp}</div>
    </div>
  </div>

  <footer>
    © ${new Date().getFullYear()} Your Company —  
    <a href="#">Privacy Policy</a>
  </footer>


</body>
</html>`})


    const otpObj = {
      email,
      otp,
    }

    await OtpModel.create(otpObj);


    res.status(200).json({
      message: "User Successfully Signed Up. Please Verify To Proceed",
      status: true,
    })


  } catch (error) {
    res.status(400).json({
      message: error.message || "something went wrong",
      status: false
    })
  }

}


export const loginController = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email, !password) {
      return res.status(400).json({
        message: "required fields are missing",
        status: false
      })
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email OR Password",
        status: false
      })
    }

    const comparePass = await bcrypt.compare(password, user.password);

    if (!comparePass) {
      return res.status(400).json({
        message: "Invalid Email or Password!",
        status: false,
      });
    }


    const secretKey = process.env.SECRET_KEY;

    const token = jwt.sign({ _id: user._id }, secretKey, {
      expiresIn: "24h",
    })

    const userData = {
      name: user.name,
      email: user.email,
      _id: user._id
    }


    return res.status(200).json({
      message: "Successfully Loged In!",
      status: true,
      data: userData,
      token,
    });


  } catch (error) {
    res.status(400).json({
      message: error.message || "something went wrong.",
      status: false
    })
  }
}

export const otpVerifyController = async (req, res) => {
  const { otp, email } = req.body;

  if (!otp || !email) {
    return res.status(400).json({
      message: "Required fields are missing",
      status: false
    });
  }

  const isExist = await OtpModel.findOne({ email, isUsed: false });

  if (!isExist) {
    return res.status(400).json({
      message: "Invalid OTP",
      status: false
    });
  }

  if (isExist.otp !== otp) {
    return res.status(400).json({
      message: "Incorrect OTP",
      status: false
    });
  }

  await OtpModel.findOneAndUpdate(
    { email },
    { isUsed: true }
  );

  const user = await UserModel.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      message: "User not found",
      status: false
    });
  }

  return res.status(200).json({
    message: "Email Successfully Verified!",
    status: true,
    data: user
  });
};


export const resetOtpController = async (req, res) => {

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "required field are missing",
      status: false
    })
  }

  const checkOtp = await OtpModel.findOne({email}); 




}