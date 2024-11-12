import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage, updateUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; 
import  verifyJWT  from "../middlewares/auth.middleware.js";

const router = Router();


router.post("/register", upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }, 
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser);

router.post("/login", loginUser);

// Secure routes
router.post("/logout", verifyJWT, logoutUser);

router.post("/refresh-token", refreshAccessToken);

router.post("/change-password", verifyJWT, changeCurrentPassword);
router.get("/current-user", verifyJWT, getCurrentUser);
router.post("/update-details", verifyJWT, updateUserDetails);
router.patch("/avatar", verifyJWT, upload.single("avatar"), updateUserAvatar);
router.patch("/cover-image", verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.post('/c/:username', verifyJWT, getUserChannelProfile);
router.get("/history", verifyJWT, getWatchHistory);




export default router