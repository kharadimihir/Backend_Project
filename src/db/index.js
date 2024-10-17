
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`mongodb://0.0.0.0:27017/${DB_NAME}`);
    console.log("Connected to MongoDB || DB HOST : ", connectionInstance);
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    process.exit(1);
  }
};

export default connectDB;

































// import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js" ;
// import dotenv from "dotenv";
// import express from "express";

// const app = express();
// dotenv.config();

// const uri = process.env.MONGODB_URI || `mongodb+srv://user123:test456@mihir.vkuv4.mongodb.net/?retryWrites=true&w=majority`;

// const options = {
//     //useNewUrlParser: true,
//     //useUnifiedTopology: true,
//     serverSelectionTimeoutMS: 5000,
// };

// const connectDB = async () => {
//     mongoose.connect(uri, options)
//     .then(() => {
//         console.log("Connected to MongoDB via Mongoose");
//     })
//      .catch((error) => {
//         if(error.name === 'MONGONETWORKERROR'){
//             console.error("Network error: Failed to connect to mongodb server");
//         }else{
//             console.error("Error connecting to MongoDB:", error);
//         }
//     });
// }

// export default connectDB;




// const connectDB = async () => {
//     try {
//         const connectionInstances = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//         console.log(connectionInstances);
//         app.on("error", (error) => {
//             console.log("Error", error);
//             //throw error;
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening onport ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log(`MONGODB CONNECTION FAILED`, error);
//         process.exit(1);
//     }
// };


