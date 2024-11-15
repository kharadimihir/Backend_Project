import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errorsApi.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/vedio.model.js";

// How to create a playlist
const createPlaylist = asyncHandler(async(req,res)=>{
    let { name, description } = req. body;
    if(!name || !description){
        throw new ApiError(404, "Name or Description is required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    });

    if(!playlist){
        throw new ApiError(500, "Playlist could not be created");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Playlist created successfully"))
});


// How to get playlist from a particular user
const getUserPlaylist = asyncHandler(async(req, res)=>{
    const { userId } = req.params;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(404, "Invalid user ID")
    }

    const playlist = await Playlist.find({owner: userId}).populate("owner", "fullName username avatar");
    if (!playlist.length) {
        throw new ApiError(404, "No playlist found")
    };

    return res
    .status(200)
    .json(new ApiResponse(200, {playlist}, "Playlist fetched successfully"))
    
});

// How to get playlist by id
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    console.log(playlistId);

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid ID");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
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
                                        email: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $arrayElemAt: ["$owner", 0] }
                        }
                    }
                ]
            }
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
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] }
            }
        }
    ]);

    if (!playlist.length) {
        throw new ApiError(404, "No playlist found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { playlist }, "Playlist fetched successfully"));
});

// How to add video to a playlist
const addVideoToPlaylist = asyncHandler(async(req, res)=>{
    const { videoId, playlistId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Authorization error: You do not own this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } },
        { new: true } // Return the updated playlist document
    );
    
    return res
    .status(200)
    .json( new ApiResponse(200, { playlist }, "Video added to playlist successfully"))
});


// How to remove a video from playlist
const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const { videoId, playlistId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Authorization error: You do not own this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId}
        },
        {
            new: true,
        }
    );
    
    return res
    .status(200)
    .json( new ApiResponse(200, { updatedPlaylist }, "Video removed from playlist successfully"))
});

// How to delete a playlist
const deletePlaylist = asyncHandler(async(req, res)=>{
    const { playlistId } = req.params;

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError( 404, "Invalid playlist ID")
    }

    const deletedPlaylist  = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user._id,
    });

    if (!deletedPlaylist) {
        throw new ApiError(404, "Playlist not found or authentication error");
    }

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Playlist deleted successfully"))
});


// How to update a playlist
const updatePlaylist = asyncHandler(async(req, res)=>{
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Authorization error: You do not own this playlist");
    }

    // Prepare update fields dynamically
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: updates },
        { new: true, runValidators: true } 
    );

    return res
        .status(200)
        .json(new ApiResponse(200, { updatedPlaylist }, "Playlist updated successfully"));
});

export {
    createPlaylist,
    getPlaylistById,
    getUserPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist
}