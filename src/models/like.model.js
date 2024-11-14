import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    video: {  // Corrected "vedio" to "video"
        type: Schema.Types.ObjectId,
        ref: "Video"  // Also ensure that your "Video" model is correctly named
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {  // Corrected "likeBy" to "likedBy"
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

export const Like = mongoose.model("Like", likeSchema);
