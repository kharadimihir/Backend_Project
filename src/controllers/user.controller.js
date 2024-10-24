import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/errorsApi.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary - avatar
    // create user object - create entry in db
    // remove password and refreshtoken field from response
    // return res

    const { fullName, email, password, username} = req.body;
    console.log(email, fullName, password, username);

    if (fullName === "") {
        throw new ApiError(400, "All fields are required"); 
    }


    // How to handle user deatails [username, fullname, password, email]
    if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // How to check whether the user already exists or not
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with this email or username is already exists");
    }

    console.log(req.files);
    //How to handle cover iamges or avatar
    //if (!req.files || !req.files.avatar || !req.files.avatar[0]) {
    //    throw new ApiError(400, "Avatar file is missing");
    //}
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);
    
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //Check whether the avatar is properly sets or not
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    //How to upload cover image and avatar on cloudianry

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // Check avatar is properly uploaded or not
    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }

    //Create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // Check whether the user is created or not

    const isUserCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!isUserCreated) {
        throw new ApiError(500, "Something went wrong")
    }


    // Return response to the user
    return res.status(201).json(
        new ApiResponse (200, isUserCreated, "User registered successfully")
    )
});


export { registerUser }