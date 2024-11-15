import { getAllLikedvideos, toggleCommentLike, toggleTweetLike, togglevideoLike } from "../controllers/like.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { Router } from "express";


const router = Router();
router.use(verifyJWT);

router.post("/toggle/v/:videoId", togglevideoLike)
router.post("/toggle/c/:commentId", toggleCommentLike)
router.post("/toggle/t/:tweetId", toggleTweetLike)
router.get("/videos", getAllLikedvideos)

export default router