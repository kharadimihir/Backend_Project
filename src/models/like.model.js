import mongoose, { Schema } from "mongoose";


const likeSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref: "comment"
    },
    vedio: {
        type: Schema.Types.ObjectId,
        ref: "Vedio"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likeBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true});

export const Like = mongoose.model("Like", likeSchema);