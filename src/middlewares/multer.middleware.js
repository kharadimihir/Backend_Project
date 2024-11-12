import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = uuidv4();
        cb(null, file.fieldname + "-" + uniqueSuffix);
    },
});

export const upload = multer({
    storage,
});


// import multer from "multer";
// import { v4 as uuidv4 } from "uuid";
// import path from "path";

// // Define file size limit (5MB in this case)
// const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB

// // Define allowed file types (only images in this example)
// const ALLOWED_FILE_TYPES = /jpeg|jpg|png|gif|svg/;

// // Define storage configuration
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         // Define the upload directory, using path module for cross-platform compatibility
//         const uploadPath = path.join(__dirname, "../public/temp");

//         // You can check if the directory exists and create it if necessary
//         cb(null, uploadPath);
//     },
//     filename: function (req, file, cb) {
//         // Generate a unique filename with UUID
//         const uniqueSuffix = uuidv4();
//         // Set the filename to include the original file extension
//         const fileExtension = path.extname(file.originalname);
//         cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
//     },
// });

// // Multer configuration with file size and type validation
// export const upload = multer({
//     storage,
//     limits: {
//         fileSize: MAX_FILE_SIZE, // Limit file size
//     },
//     fileFilter: function (req, file, cb) {
//         // Validate file type
//         const mimeType = ALLOWED_FILE_TYPES.test(file.mimetype);
//         if (!mimeType) {
//             return cb(new Error("Invalid file type. Only image files are allowed."));
//         }
//         cb(null, true);
//     },
// });

