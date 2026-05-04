import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoute from "./routes/authRoute.js";
import { dbConnect } from "./config/db.js";
import helmet from 'helmet';
import morgan from 'morgan';
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
 


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet())
app.use(morgan('dev'));

dbConnect();



app.use("/api/auth", authRoute);


app.get("/", (req, res) => {
    res.status(200).json({
        message: "Server Running...!!!"
    })
})

app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`)
})
