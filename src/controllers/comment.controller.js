import { ApiError } from "../utils/errorsApi.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";

// How to get video comment
const getVideoComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(404, "Inavlid Video ID");
    }

    const comments = await Comment.find({ video: videoId })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("owner", "fullName username avatar")
        .sort({ createdAt: -1 })
        .populate("owner", "fullName username avatar")
        .populate({
            path: "reply",
            populate: {
                path: "owner", 
                select: "fullName username avatar"
            }
        });

    const totalComments = await Comment.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                totalPages: Math.ceil(totalComments / limit),
                currentPage: parseInt(page),
            },
            "Comments fetched successfully"
        )
    );
});

// How to add comment
const addcomment = asyncHandler(async (req, res) => {
    const { videoId, commentId } = req.params;
    const { content } = req.body;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(404, "Inavlid Playlist ID");
    }

    if (!content) {
        throw new ApiError(400, "comment content is required");
    }

    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoId,
    });

    if (!comment) {
        throw new ApiError(400, "comment not added");
    }

    if (commentId) {
        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            throw new ApiError(400, "Reply to comment not found");
        }

        parentComment.reply.push(comment._id);
        await parentComment.save();
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "comment added succesfully"));
});

// How to update comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content) {
        throw new ApiError(400, "comment content required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(400, "comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "Unauthorized request: You do not own this comment"
        );
    }

    comment.content = content;
    comment.isUpdated = true;
    await comment.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, comment, "comment updated succesfully"));
});

// How to delete comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "Unauthorized request: You do not own this comment"
        );
    }

    // comment.content = null;  This code doesn't delete comment from the database
    // comment.isDeleted = true;
    // await comment.save({ validateBeforeSave: false });

    await comment.deleteOne();

    await Comment.deleteMany({ replyTo: commentId });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});


export {
    getVideoComment,
    addcomment,
    deleteComment,
    updateComment,
}