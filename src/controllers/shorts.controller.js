import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errorsApi.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Short } from "../models/shorts.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/vedio.model.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import exp from "constants";
import path from "path";
import mongoose from "mongoose";




// How to get all shorts
const getAllShorts = asyncHandler(async(req, res)=>{
    const { page=1, limit=10, query, sortBy="createdAt", sortType="asc", userId } = req.query;

    const matchConditions = {};
    matchConditions.isPublished = true;

    if(query){
        matchConditions.title = { $regex: query, $options: "i" };
    }

    if(userId){
        matchConditions.owner = userId;
    }

    // Sort conditions
    const sortConditions = {};
    sortConditions[sortBy] = sortType === "desc" ? -1 : 1;

     // fetch shorts with pagination and sorting
    const shorts = await Video.find(matchConditions)
    .sort(sortConditions)
    .skip((page - 1 )*limit)
    .limit(parseInt(limit))
    .populate("owner", "fullName usrname avatar");
 
    const totalShorts = await Video.countDocuments(matchConditions);

    return res
    .status(200)
    .json(new ApiResponse(200, { shorts,  
        totalPages: Math.ceil(totalShorts / limit),
        currentPage: parseInt(page), 
    }, 
    "Shorts fetched successfully")
    )
});

// How to published a short
const publishedAShort = asyncHandler(async (req, res) => {
    const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov'];
    const ALLOWED_THUMBNAIL_EXTENSIONS = ['.jpeg', '.jpg', '.png'];

    const { title, description } = req.body;

    if (!title) throw new ApiError(400, "Title is required.");
    if (!description) throw new ApiError(400, "Description is required.");

    const shortFile = req.files?.shortFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!shortFile?.path) throw new ApiError(400, "Short video file is required.");
    if (!thumbnailFile?.path) throw new ApiError(400, "Thumbnail image file is required.");

    // Video file validation
    const shortFileExtension = path.extname(shortFile.originalname).toLowerCase();
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(shortFileExtension)) {
        throw new ApiError(400, "Video extension must be one of: MP4, MKV, AVI, MOV.");
    }

    // Thumbnail file validation
    const thumbnailFileExtension = path.extname(thumbnailFile.originalname).toLowerCase();
    if (!ALLOWED_THUMBNAIL_EXTENSIONS.includes(thumbnailFileExtension)) {
        throw new ApiError(400, "Thumbnail extension must be one of: JPEG, JPG, PNG.");
    }

    try {
        // Upload video and thumbnail to Cloudinary
        const uploadedShortFile = await uploadOnCloudinary(shortFile.path);
        const uploadedThumbnailFile = await uploadOnCloudinary(thumbnailFile.path);

        if (!uploadedShortFile) throw new ApiError(500, "Failed to upload video to Cloudinary.");
        if (!uploadedThumbnailFile) throw new ApiError(500, "Failed to upload thumbnail to Cloudinary.");

        // Create video document in the database
        const short = await Short.create({
            shortFile: uploadedShortFile.url,
            title,
            description,
            thumbnail: uploadedThumbnailFile.url,
            duration: uploadedShortFile.duration,
            owner: req.user._id,
        });

        return res.status(200).json(
            new ApiResponse(200, { short }, "Short published successfully.")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to publish Short.");
    }
});


// How to get Short 
const  getShortById = asyncHandler(async(req, res)=>{
    const { shortId } = req.params;

    if (!shortId || !mongoose.Types.ObjectId.isValid(shortId)) {
        throw new ApiError(400, "Invalid or missing Short ID");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    if (!user.watchHistory.includes(shortId)) {
        user.watchHistory.push(shortId);
        await user.save({ validateBeforeSave: false });
        await Short.findByIdAndUpdate(
            shortId, 
            {
                $inc: { views: 1 }
            },
            {
                new: true
            }
        )
    }

    const short = await Short.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(shortId), isPublished: true}
        },
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
                            email: 1,
                            username: 1,
                            avatar: 1
                        },
                    },
                ],
            },
        },

        {
            $addFields: { owner: {$arrayElemAt: ["$owner", 0]}},
        }
    ]);
    console.log(short);

    if (!short || !short.length) {
        throw new ApiError(400, "Short not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, short[0], "Short fetched successfully"))
});

// How to update a short
const updateShort = asyncHandler(async (req, res) => {
    const { shortId } = req.params;
    const { title, description, thumbnail } = req.body;

    if (!shortId || !mongoose.Types.ObjectId.isValid(shortId)) {
        throw new ApiError(400, "Invalid or missing Short ID");
    }

    // Find the short video and verify ownership before proceeding
    const short = await Short.findById(shortId);
    if (!short) {
        throw new ApiError(404, "Short not found");
    }

    if (short.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    // Prepare updateFields only with fields that are provided in the request
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;

    // If a new thumbnail is provided, upload it to Cloudinary
    if (thumbnail) {
        try {
            const uploadedThumbnail = await uploadOnCloudinary(thumbnail);
            if (uploadedThumbnail && uploadedThumbnail.url) {
                updateFields.thumbnail = uploadedThumbnail.url;
            } else {
                throw new ApiError(500, "Failed to upload thumbnail");
            }
        } catch (error) {
            throw new ApiError(500, error.message || "Error uploading thumbnail");
        }
    }

    // Check if there's at least one field to update
    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "At least one field must be provided to update");
    }

    // Update the short details
    const updatedShort = await Short.findByIdAndUpdate(
        shortId,
        { $set: updateFields },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, { updatedShort }, "Short updated successfully")
    );
});



// How to delete short
const deleteShort = asyncHandler(async(req, res)=>{
    const { shortId } = req.params;
    if (!shortId || !mongoose.Types.ObjectId.isValid(shortId)) {
        throw new ApiError(400, "Invalid or missing Short ID");
    }

    // Find the video to ensure it exists
    const short = await Short.findById(shortId);
    if (!short) {
        throw new ApiError(404, "Short not found");
    }

    // Check if the authenticated user is the owner of the video
    if (short.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this short");
    }

    await Short.findByIdAndDelete(shortId);
    await Like.deleteMany( {short: shortId});
    await Comment.deleteMany( {short: shortId});

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Short deleted successfully"))
});

// Published or unPublished the short
const  togglePublishStatus = asyncHandler(async(req, res)=>{

    const { shortId } = req.params;

    if (!shortId || !mongoose.Types.ObjectId.isValid(shortId)) {
        throw new ApiError(400, "Invalid or missing Short ID");
    }

    // Find the short to ensure it exists
    const short = await Short.findById(shortId);
    if (!short) {
        throw new ApiError(404, "Short not found");
    }

    // Check if the authenticated user is the owner of the short
    if (short.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this short");
    }

    const updatedShort = await Short.findByIdAndUpdate(
        shortId,
        {
            $set: {
                isPublished: !short.isPublished, // Toggle the publish status
            }
        },
        {
            new: true  // Return the updated short document
        }
    );
    const message = updatedShort.isPublished? "Short Published Successfully" : "Short Unpublished Successfully";

    return res
    .status(200)
    .json(new ApiResponse(200, { updatedShort }, `${message}`))
});


export {
    getAllShorts,
    publishedAShort,
    getShortById,
    updateShort,
    deleteShort,
    togglePublishStatus
}