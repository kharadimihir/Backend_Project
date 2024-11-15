import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/errorsApi.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js"
import { channel, subscribe } from "diagnostics_channel";

// How to do subscribe a channel
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    let isChannelExist = await User.findById(channelId);

    if (!isChannelExist) {
        isChannelExist = await User.create({
            _id: channelId, 
        });

        if (!isChannelExist) {
            throw new ApiError(500, "Failed to create channel (user)");
        }
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id,
    });

    if (existingSubscription) {
        await existingSubscription.remove();
        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    } else {
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user._id,
        });

        if (!newSubscription) {
            throw new ApiError(500, "Failed to create subscription");
        }

        return res.status(200).json(new ApiResponse(200, {}, "Subscribed successfully"));
    }
});


// How to get user channel subscribers
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    try {
        const subscribers = await Subscription.find({ channel: channelId })
            .populate("subscriber", "username fullName avatar");

        if (!subscribers.length) {
            return res
                .status(200)
                .json(new ApiResponse(200, [], "No subscribers found"));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to fetch subscribers");
    }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
  
    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
      throw new ApiError(400, "Invalid subscriberId ID");
    }
  
    const subscribingTo = await Subscription.find({ subscriber: subscriberId })
      .populate("channel", "fullName username email avatar")
      .exec();
  
    if (!subscribingTo.length) {
      throw new ApiError(404, "No subscribed channel found");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, subscribingTo, "Subscribed channel fetched successfully")
    );
});

export {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
}