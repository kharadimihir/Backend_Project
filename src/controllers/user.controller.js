import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errorsApi.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { channel, subscribe } from "diagnostics_channel";
import mongoose from "mongoose";
import { pipeline } from "stream";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        //Find User
        const user = await User.findById(userId);

        //Generate refresh and access token
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //Update or save tokens in database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); //To directly save or update user in database without checking any validation

        return { refreshToken, accessToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something wen wrong while generating refresh and access tokens"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary - avatar
    // create user object - create entry in db
    // remove password and refreshtoken field from response
    // return res

    const { fullName, email, password, username } = req.body;
    console.log(email, fullName, password, username);

    if (fullName === "") {
        throw new ApiError(400, "All fields are required");
    }

    // How to handle user deatails [username, fullname, password, email]
    if (
        [fullName, username, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // How to check whether the user already exists or not
    const existedUser = await User.findOne({
        $or: [{ username: username }, { email: email }],
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "User with this email or username is already exists"
        );
    }

    console.log(req.files);
    //How to handle cover iamges or avatar
    //if (!req.files || !req.files.avatar || !req.files.avatar[0]) {
    //    throw new ApiError(400, "Avatar file is missing");
    //}
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //Check whether the avatar is properly sets or not
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    //How to upload cover image and avatar on cloudianry

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // Check avatar is properly uploaded or not
    if (!avatar) {
        throw new ApiError(400, "Avatar is required");
    }

    //Create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    // Check whether the user is created or not

    const isUserCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!isUserCreated) {
        throw new ApiError(500, "Something went wrong");
    }

    // Return response to the user
    return res
        .status(201)
        .json(
            new ApiResponse(200, isUserCreated, "User registered successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    /* 
    Steps:-
        1) req body -> data
        2) Verify using username and email
        3) find the user
        3) password Check
        4) access and refresh token 
        5) send cookie and response 
    */

    const { username, email, password } = req.body;

    //Check if both email and username is absent
    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }], // Find user based on username or email
    });

    //Check if user is present or not
    if (!user) {
        throw ApiError(404, "User does not exist");
    }

    //Check if password is correct or not
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials");
    }

    //Call function for generating refresh and access tokens
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password, -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    refreshToken,
                    accessToken,
                },
                "User Logged In Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1, // this removes the field from document
            },
        },

        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", options)
        .cookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is invalid or expire");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } =
            await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refresToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Your Access Token is refreshed Successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
});

// Change password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    let { oldPassword, newPassword, confirmPassword } = req.body;

    if (!(newPassword===confirmPassword)) {
        throw new ApiError(400, "Please enter a valid password");
    }

    const user = await User.findById(req.user?._id);

    //if (user.password != newPassword) throw new ApiError(401, "Incorrect Password");
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password change Successfully"));
});


// Get current user
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetched successfully"));
});

// Update account details
const updateUserDetails = asyncHandler(async(req, res)=>{
    let { fullName, email, username } = req.body;

    if(!fullName || !email){
        throw new ApiError(400, "Please give the valid info");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                fullName: fullName,
                email: email,
                username: username
            },
        },
        {
            new: true
        }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updaetd successfully"))
});

// update Avatar
const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
});

// Update coverimage
const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"))
});


const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})




const getWatchHistory = asyncHandler(async(req, res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },

        {
            $lookup: {
                from: "vedioes",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]   
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully")
    )
})






export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserCoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory
};
