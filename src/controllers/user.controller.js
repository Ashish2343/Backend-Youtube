import {asyncHandler} from '../utils/asyncHandeler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {Subscription} from '../models/subscription.model.js';
import {uploadonCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';


const generateAccessandRefreshToken = async(userId) =>{
    try{
       const user =  await User.findById(userId)
       const AccessToken = user.generateAccessToken()
       const RefreshToken = user.generateRefreshToken()

       user.refreshToken = RefreshToken
      await  user.save({validateBeforeSave: false})

        return {
            AccessToken,
            RefreshToken
        }
       
    }   catch(e){
        throw new ApiError(500, 'Something went wrong while generating refresh token and access token')
    }
}


const registerUser = asyncHandler(
    async(req,res)=>{
        // get user details from frontend   
        // validation (not empty)
        // check if user already exists : username, email
        // check for images and avtar
        // upload them to cloudinary
        // create user object - entery in db
        // remove password and refresh toen field from response
        // check for user creation
        // return response
        

        const {username, email, password,fullname} = req.body;  // Step 1
     //   console.log(email);

   //     console.log(req.body);

    // Step 2
        if(username === ""){
            throw new ApiError(400, "username is required");
        }
        if(email === ""){
            throw new ApiError(400, "email is required");
        }
        if(password === ""){
            throw new ApiError(400, "password is required");
        }
        if(fullname === ""){
            throw new ApiError(400, "fullname is required");
        }

     const ExistedUser = await User.findOne({
            $or: [{ username },{ email }]     // Step 3
        })

        if(ExistedUser){
            throw new ApiError(409, "username or email is already taken");
        }
    
    const avatarLocalPath = req.files?.avatar[0]?.path  // Step 4
  //  const CoverImageLocalPath = req.files?.coverImage[0]?.path
        let CoverImageLocalPath
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
            CoverImageLocalPath = req.files.coverImage[0].path
        }

  //  console.log(req.files)

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar is required");
    }  

    const avatar = await uploadonCloudinary(avatarLocalPath)    // Step 5
    const CoverImage = await uploadonCloudinary(CoverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "avatar is required");
    }

    const user = await User.create({    // Step 6
        fullname,
        avatar: avatar.url,
        CoverImage: CoverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(   // Step 7
        "-password -refreshToken",
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user");     // Step 8
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )
 });

 const loginUser = asyncHandler(async (req, res) => {
        // req body -> data
        // username or password
        // find the user
        // password check
        // access and refresh token generate 
        // send cookies 


        const {email, username, password} =  req.body

        if(! username && ! email){
            throw new ApiError(400, "username or email is required");
        }

       const user = await User.findOne({
            $or: [{ username },{ email }]
        })

        if(!user){
            throw new ApiError(404, "username does not exist")
        }
        
        const isPasswordCorrect = await user.isPasswordCorrect(password)

        if(!isPasswordCorrect){
            throw new ApiError(401, "password is incorrect")
        }  
        
       const {accessToken , refreshToken} =  await generateAccessandRefreshToken(user._id)
        
       const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

       const options = {
            httpOnly: true,
            secure: true
       }

       return res.status(200).
       cookie("accessToken", accessToken, options).
       cookie("refreshToken", refreshToken, options).
       json(new ApiResponse(200, {
            user: loggedInUser,accessToken, refreshToken    // data
        }, "user logged in successfully"
        ))
 });


 const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})



const getUserChannelProfile =  asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

  const channel =  await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                CoverImage: 1
            }
        }    
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel not Exist")
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "channel profile fetched successfully")
    )
})


const getWatchedHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        } 
                    }
                ]
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistory, "watched history fetched successfully")
    )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    getUserChannelProfile,
    getWatchedHistory
}
