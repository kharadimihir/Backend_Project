import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter  from "./routes/user.routers.js"
import videoRouter from "./routes/video.routers.js"
import tweetRouter from "./routes/tweet.routers.js"
import likeRouter from "./routes/like.routers.js"
import PlaylistRouter  from "./routes/playlist.routers.js";
import commentRouter from "./routes/comment.routers.js";
import subscriptionRouter from "./routes/subscription.routers.js";
import healthcheckRouter from "./routes/healthcheck.routers.js";
import dashboardRouter from "./routes/dashboard.routers.js";
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
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/tweets", tweetRouter) 
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", PlaylistRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/dashboard", dashboardRouter)


// http://localhost:8000/api/v1/users/register
export default app 