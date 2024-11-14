import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errorsApi.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import cookieParser from "cookie-parser";

// const verifyJWT = asyncHandler(async (req, res, next) => {
//     try {
//         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

//         if (!token) {
//             throw new ApiError(401, "Unauthorized Request");
//         }

//         const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
//         const user = await User.findById(decodedUser?._id).select(
//             "-password -refreshToken"
//         );

//         if (!user) {
//             throw new ApiError(401, "Invalid Access Token");
//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid Access Token");
//     }
// });

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        // If no token is found, respond with Unauthorized
        if (!token) {
            throw new ApiError(401, "Unauthorized Request: No token provided");
        }

        // Verify the token using the secret
        const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Fetch the user associated with the token
        const user = await User.findById(decodedUser?._id).select("-password -refreshToken");

        // If the user is not found, respond with Unauthorized
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // Attach the user to the request object
        req.user = user;
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        // Handle specific token expiration errors
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Token has expired");
        }
        // Handle any other JWT errors (e.g., invalid token)
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});


export default verifyJWT;
