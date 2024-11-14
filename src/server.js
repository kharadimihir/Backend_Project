import dotenv from "dotenv"
import connectDB from "./db/index.js";
import express from "express"
import app from "./app.js";
dotenv.config({
    path: '/.env'
})


// const app = express();
connectDB()
.then(() => {
    app.on("Error", (error) => {
        console.log("Error", error);
        throw error;
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})












/* import express from "express";

const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("Error", (error) => {
            console.log("Error", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listeneing on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR", error);
        throw error;
    }
})() */