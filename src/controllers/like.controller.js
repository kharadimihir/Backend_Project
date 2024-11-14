import { Like } from "../models/like.model";
import { ApiError } from "../utils/errorsApi.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, {isValidObjectId} from "mongoose";

// How to do like on videos
const togglevideoLike = asyncHandler(async(req, res) => {
    let { videoId } = req.params;
    
    if (!videoId) {
        throw new ApiError(404, "video ID is required");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "video unliked successfully"))
    }else{
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        return res
        .status(200)
        .json(new ApiResponse(200, {newLike}, "video liked successfully"))
    }
   
});


// How to do like on comments
const toggleCommentLike = asyncHandler(async(req, res)=>{
    let {videoId, commentId} = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(404, "Valid video ID is required");
    }

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(404, "Valid comment ID is required");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        comment: commentId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment unliked successfully"))
    }else{
        const newLike = await Like.create({
            video: videoId,
            comment: commentId,
            likedBy: req.user._id
        });

        return res
        .status(200)
        .json(new ApiResponse(200, {newLike}, "comment liked successfully"))
    }
});


// How to do like on tweets
const toggleTweetLike = asyncHandler(async(req, res)=>{
    let { tweetId } = req.params;

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(404, "Valid tweet ID is required")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet unliked successfully"))
    }else{
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        });

        return res
        .status(200)
        .json(new ApiResponse(200, {newLike}, "Tweet liked successfully"))
    }
});


// How to get all liked videos
const getAllLikedvideos = asyncHandler(async(req, res)=>{
    const likedvideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "user",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        email: 1,
                                        username: 1
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" },
                        }
                    }
                ]
            },
            
        },
        {
            $unwind: "$likedVideos"
        },
        {
            $replaceRoot: {newRoot: "$likedVideos"}
        }
    ]);


    return res
    .status(200)
    .json(new ApiResponse(200, {likedvideoes}, "Liked vidoes fetched successfully"))
});


export {
    getAllLikedvideos,
    toggleCommentLike,
    toggleTweetLike,
    togglevideoLike
}

