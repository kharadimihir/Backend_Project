import mongoose, { Schema, Types } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { type } from "os";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    vedio: {
        type: Schema.Types.ObjectId,
        ref: "Vedio"
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    isDeleted: {
        type: Boolean,
        default: false,
      },
      isUpdated: {
          type: Boolean,
          default: false,
        },
    reply: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment",
        },
      ],


},{timestamps: true});

commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = mongoose.model("Comment", commentSchema);