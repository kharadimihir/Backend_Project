import { addcomment, deleteComment, getVideoComment, updateComment } from "../controllers/comment.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { Router } from "express";


const router = Router();
router.use(verifyJWT);

router
.get("/:videoId", getVideoComment)
.post("/:videoId", addcomment)

router
.patch("/c/:commentId", updateComment)
.delete("/c/:commentId", deleteComment)

export default router