import { mongoose, Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,  // Cloudinary URL or video storage URL
            required: true
        },

        thumbnail: {
            type: String,  // cloudinary url for thumbnail
            required: true
        },

        title: {
            type: String,  
            required: true
        },

        description: {
            type: String,  
            required: true
        },

        duration: {
            type: Number,  // Duration in seconds or minutes
            required: true
        },

        views: {
            type: Number,
            default: 0
        },

        isPublished: {
            type: Boolean,
            deafult: true   
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },

    {
        timestamps: true
    }
);

// Plugin for aggregate pagination
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)