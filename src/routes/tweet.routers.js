import verifyJWT from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { createTweet, deleteTweet, getUserTweet, updateTweet } from "../controllers/tweet.controller.js";

const router = Router();
router.use(verifyJWT);


router.post("/", createTweet);
router.get("/users/:userId", getUserTweet);
router.patch("/:tweetId", updateTweet).delete("/:tweetId", deleteTweet)

export default router