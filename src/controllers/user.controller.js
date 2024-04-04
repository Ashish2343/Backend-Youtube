import {asyncHandler} from '../utils/asyncHandeler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadonCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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


export {registerUser}
