import verifyJWT from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishedAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { Router } from "express";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file


router
.get("/", getAllVideos)
.post("/", upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishedAVideo
);

router
.get("/:videoId", getVideoById)
.delete("/:videoId", deleteVideo)
.patch("/:videoId", upload.single("thumbnail", updateVideo));

router
.patch("/toggle/publish/:videoId", togglePublishStatus);

export default router