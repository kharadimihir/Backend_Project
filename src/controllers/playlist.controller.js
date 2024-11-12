import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errorsApi.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";

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
    let user = await User.findById(req.user._id);
})
