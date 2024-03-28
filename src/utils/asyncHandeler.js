// M1
const asyncHandler = (requestHandeler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandeler(req,res,next)).catch((err)=> next(err));
    }
}

export {asyncHandler} 




//M2
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }