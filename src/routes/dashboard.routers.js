import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import verifyJWT from '../middlewares/auth.middleware.js';

const router = Router({mergeParams: true});

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.get("/stats", getChannelStats);
router.get("/videos", getChannelVideos);

export default router