import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import  userRouter  from "./routes/user.routers.js"
const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: "14kb"})); // Set limits how much json data can handle by express
app.use(express.urlencoded({extended: true, limit: "14kb"})); // Because different browser gives data in such form like "Mihir + kharadi"  or Mihir%20kharadi
app.use(express.static("public"));  // For savind some files or data in local system which can be shown by anyone
app.use(cookieParser());



// routes declaration
app.use("/api/v1/users", userRouter)

// http://localhost:8000/api/v1/users/register
export {app} 