import verifyJWT from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteShort, getAllShorts, getShortById, publishedAShort, togglePublishStatus, updateShort } from "../controllers/shorts.controller.js";


const router = Router({ mergeParams: true });
router.use(verifyJWT)

router
.get("/",getAllShorts)
.post("/", upload.fields([
    {
        name: "shortFile",
        maxCount: 1,
    },
    {
        name: "thumbnail",
        maxCount: 1,
    },
]), publishedAShort)

router
.get("/:shortId", getShortById)
.delete("/:shortId", deleteShort)
.patch("/:shortId", upload.single("thumbnail"), updateShort)

router.patch("/toggle/publish/:shortId", togglePublishStatus)


export default router
