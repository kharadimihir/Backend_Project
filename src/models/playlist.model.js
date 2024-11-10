import mongoose, {Schema} from "mongoose";
import { type } from "os";

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required:true
    },
    vedio: [
        {
            type: Schema.Types.ObjectId,
            ref: "Vedio"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true});

export const Playlist = mongoose.model("Playlist", playlistSchema)