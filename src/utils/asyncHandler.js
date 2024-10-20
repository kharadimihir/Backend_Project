
// If we get promises then we have to use .then.Catch method to handle errror

const asyncHandler = (requsetHandler) => {
   return (req, res, next) => {
    Promise.resolve(requsetHandler(req, res, next)).catch((err) => next(err));
   }

}
export {asyncHandler}





// When we use tryCatch 
/*const asyncHandler = (fn) => async (req, res, next)=>{
    try {
        await fn(req, res, next) 
    } catch (error) {
        resizeBy.status(error.code || 500).json({
            success: false,
            message: error.message,
        })
    }
}*/