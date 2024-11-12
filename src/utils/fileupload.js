import cloudinary from "cloudinary";
import fs from "fs";


cloudinary.v2.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET,
    secure: true        // Click 'View API Keys' above to copy your API secret
});     


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload file on cloudianry
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // File has been uploaded successfull
        //console.log("file is uloaded on cloudianry", response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)  // remove the locally saved temporary file as the upload got failed
        return null;
    }
}


export { uploadOnCloudinary } 