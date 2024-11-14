import cloudinary from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true
});

// Function to upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
    try {
        if (!localFilePath) {
            console.error("Local file path is required for upload.");
            return null;
        }

        // Ensure the file exists before attempting upload
        if (!fs.existsSync(localFilePath)) {
            console.error("File does not exist at path:", localFilePath);
            return null;
        }

        // Upload the file to Cloudinary
        const response = await cloudinary.v2.uploader.upload(localFilePath, {
            resource_type: resourceType
        });
        
        // console.log(`${resourceType} uploaded to Cloudinary:`, response.url);

        // Delete the local file after successful upload
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        // console.error(`Error uploading ${resourceType} to Cloudinary:`, error.message);
        
        // Delete the local file if it exists to clean up
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};



export { uploadOnCloudinary } 


// import {v2 as cloudinary} from "cloudinary"
// import fs from "fs"


// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     console.log(localFilePath);
//     // if (localFilePath.endsWith(".jpg") || localFilePath.endsWith(".mp4")) {
//     //     localFilePath = localFilePath.slice(0, -4);
//     // }
//     // console.log(localFilePath);
//     try {
//         if (!localFilePath) return null
//         //upload the file on cloudinary
//         const response = await cloudinary.uploader.v2.upload(localFilePath, {
//             resource_type: "auto"
//         })
//         console.log(response);
//         // file has been uploaded successfull
//         //console.log("file is uploaded on cloudinary ", response.url);
//         fs.unlinkSync(localFilePath)
//         return response;

//     } catch (error) {
//         fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
//         return null;
//     }
// }

// export {uploadOnCloudinary}