import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router({mergeParams: true});
router.use(verifyJWT);


router.get("/c/:channelId", getSubscribedChannels);
router.post("/c/:channelId", toggleSubscription);

router.get("/subscribers/:subscriberId", getUserChannelSubscribers);

export default router