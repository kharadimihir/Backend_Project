import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errorsApi.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/vedio.model.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/fileupload.js";
import mongoose, {isValidObjectId} from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { Like }from "../models/like.model.js";
import { Comment } from "../models/comment.model.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// How to get all videos
const getAllVideos = asyncHandler(async(req, res)=>{
    
    const { page=1, limit=10, query, sortBy="createdAt", sortType="asc", userId } = req.query;

    // Match conditions
    const matchConditions = { isPublished: true};
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


    // fetch videos with pagination and sorting
    const videos = await Video.find(matchConditions)
    .sort(sortConditions)
    .skip((page - 1 )*limit)
    .limit(parseInt(limit))
    .populate("owner", "fullName usrname avatar");

    const totalVideos = await Video.countDocuments(matchConditions);

    return res
    .status(200)
    .json(new ApiResponse(200, { videos,  
        totalPages: Math.ceil(totalVideos / limit),
        currentPage: parseInt(page), 
    }, 
    "Videos fetched successfully")
    )
});





// How to published a vedio
const publishedAVideo = asyncHandler(async(req, res)=>{

    const videoFileTypes = /\.mp4$/;
    const thumbnailFileTypes = /\.(jpeg|jpg|png)$/;

    let { title, description } = req.body;

    if(!title){
        throw new ApiError(400, "Title is required")
    }

    if (!description) {
        throw new ApiError(400, "Description is required")
    }

    if (!req.files?.videoFile) {
        throw new ApiError(400, "Video is required")
    }

    // Checking Video condtions
    let videoFilePath = req.files?.videoFile[0]?.path;

    if (!req.files?.videoFile || !req.files.videoFile[0]?.path) {
        throw new ApiError(400, "Video file is required");
    }

    const videoFileExtension = path.extname(req.files?.videoFile[0]?.originalname).toLowerCase();
    const isVideo = videoFileTypes.test(videoFileExtension);

    if (!isVideo) {
        throw new ApiError(400, "Video extension must be MP4 MKV AVI MOV")
    }

    // Checking Thumbnail condtions
    let thumbnailFilePath = req.files?.thumbnail[0]?.path;

    if (!req.files?.thumbnail || !req.files.thumbnail[0]?.path) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const thumbnailFileExtension = path.extname(req.files?.thumbnail[0]?.originalname).toLowerCase();
    const isThumbnail = thumbnailFileTypes.test(thumbnailFileExtension);


    if (!isThumbnail) {
        throw new ApiError(400, "Thumbnail extension must be jpeg jpg png")
    }



    // Uplaod video and thumbnail on cloudinary
    try {
        const videoFile = await uploadOnCloudinary(videoFilePath);
        const thumbnailFile = await uploadOnCloudinary(thumbnailFilePath);
    
        if (!videoFile) {
            throw new ApiError(400, "Video file is required")
        }
    
        if (!thumbnailFile) {
            throw new ApiError(400, "Thumbnail file is required")
        }
    
        const video = await Video.create({
            videoFile: videoFile.url,
            title: title,
            description: description,
            thumbnail: thumbnailFile.url,
            duration: videoFile.duration,
            owner: req.user._id,
        });
    
        return res
        .status(200)
        .json( new ApiResponse(200, { video }, "Video published succesfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to publish video");
    }
});


// How to get video 
const  getVideoById = asyncHandler(async(req, res)=>{
    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing Video ID");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    if (!user.watchHistory.includes(videoId)) {
        user.watchHistory.push(videoId);
        await user.save({ validateBeforeSave: false });
        await Video.findByIdAndUpdate(
            videoId, 
            {
                $inc: { views: 1 }
            },
            {
                new: true
            }
        )
    }

    const video = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(videoId), isPublished: true}
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
            $addFields: { $owner: {$arrayElemAt: ["$owner", 0]}},
        }
    ]);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"))
});

// const getVideoById = asyncHandler(async (req, res) => {
//     const { videoId } = req.params;

//     if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
//         throw new ApiError(400, "Invalid or missing Video ID");
//     }

//     const user = await User.findById(req.user._id);
//     if (!user) {
//         throw new ApiError(404, "User does not exist");
//     }

//     // Update watch history and increment views
//     if (!user.watchHistory.includes(videoId)) {
//         user.watchHistory.push(videoId);
//         await user.save({ validateBeforeSave: false });
//         await Video.findByIdAndUpdate(
//             videoId, 
//             { $inc: { views: 1 } },
//             { new: true }
//         );
//     }

//     const video = await Video.findById(videoId)
//         .where("isPublished").equals(true)
//         .populate("owner", "fullName username email avatar");

//     if (!video) {
//         throw new ApiError(400, "Video not found");
//     }

//     return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
// });


// How to update video details
const updateVideo = asyncHandler(async(req, res)=>{
    const { videoId } = req.params;
    let { title, description, thumbnail } = req.body;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid or missing Video ID");
    }

    // Find the video to ensure it exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Set updateFields object
    const updateFields = {};

    if(title){
        updateFields.title = title;
    }

    if(description){
        updateFields.description = description;
    }

    if(thumbnail){
        const updatedThumbnail = await uploadOnCloudinary(thumbnail);
        if (!updatedThumbnail) {
            throw new ApiError(400, "Thumnail is not updated yet")
        }
        updateFields.thumbnail = thumbnail;
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "At least one field must be provided to update");
    }


    // Check if the authenticated user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }


    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, { updatedVideo }, "Video updated successfully"))

});

// // How to delete video
const deleteVideo = asyncHandler(async(req, res)=>{
    const { videoId } = req.params;
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid or missing Video ID");
    }

    // Find the video to ensure it exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the authenticated user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    await Video.findByIdAndDelete(videoId);
    await Like.deleteMany( {video: videoId});
    await Comment.deleteMany( {video: videoId});

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Video deleted successfully"))
})

// Published or unPublished the video
const  togglePublishStatus = asyncHandler(async(req, res)=>{

    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid or missing Video ID");
    }

    // Find the video to ensure it exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the authenticated user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        video,
        {
            $set: {
                isPublished: !video.isPublished, // Toggle the publish status
            }
        },
        {
            new: true  // Return the updated video document
        }
    );
    const message = updateVideo.isPublished? "Video Published Successfully" : "Video Unpublished Successfully";

    return res
    .status(200)
    .json(new ApiResponse(200, { updatedVideo }, `${message}`))
});

export {
    getAllVideos,
    publishedAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}