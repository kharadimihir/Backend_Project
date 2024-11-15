import verifyJWT from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylist, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWT);

router.post("/", createPlaylist)

router
.get("/:playlistId", getPlaylistById)
.patch("/:playlistId", updatePlaylist)
.delete("/:playlistId", deletePlaylist)

router.patch("/add/:videoId/:playlistId", addVideoToPlaylist)
router.patch("/remove/:videoId/:playlistId", removeVideoFromPlaylist)

router.get("/user/:userId", getUserPlaylist)

export default router