import { ApiError } from "../utils/errorsApi.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Tweet from "../models/tweet.model.js"


// How to create a new tweet
const createTweet = asyncHandler(async(req, res)=>{
    let { content } = req.body;

    if (!content) {
        throw new ApiError(400, "content is missing")
    }

    const tweet = Tweet.create({
        content,
        owner: req.user._id,
    });

    if (!tweet) {
        throw new ApiError(401, "Tweet is missing");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {tweet}, "Tweet is successfully created"))
});

// How to get all tweets of a particular user
const getUserTweet = asyncHandler(async(req, res)=>{
    const userTweet = await Tweet.findById(req.user._id)
    .sort({createdAt: -1});


    if (!userTweet) {
        throw new ApiError(400, "User tweets are missing");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {userTweet}, "Tweets retrieved successfully"))
});

// How to update tweets
const updateTweet = asyncHandler(async(req, res)=>{
    let { tweetId } = req.params;
    let { newTweet } = req.body;

    if (!tweetId) {
        throw new ApiError(500, "Tweet id is required");
    }

    if (!newTweet) {
        throw new ApiError(500, "Updated tweet content is required");
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        {_id: tweetId, owner: req.user._id}, 
        {content: newTweet},
        {new: true}
    );

    if(!updatedTweet){
        throw new ApiError(400, "Tweet not found or not authorized to update");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {updateTweet}, "Tweet updated successfully"))
});

// How to delete tweet
const deleteTweet = asyncHandler(async(req, res)=>{
    let { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(500, "Tweet ID is required");
    }

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId, owner: req.user._id
    })

        if (!deleteTweet) {
            throw new ApiError(404, "Tweet not found or not authorized to delete")
        }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"))

});

export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}