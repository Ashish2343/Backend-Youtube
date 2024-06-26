import {Router} from 'express';
import { logoutUser,loginUser ,registerUser, getUserChannelProfile, getWatchedHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(
        upload.fields([
            {
                name: 'avatar',
                maxCount: 1

            },
            {
                name: 'coverImage',
                maxCount: 1
            }
        ])  
    ,registerUser);


router.route('/login').post(loginUser);


// Secure Routes
router.route('/logout').post(verifyJWT,  logoutUser);

router.route('/c/:username').get(verifyJWT,getUserChannelProfile)
router.route('/history').get(verifyJWT, getWatchedHistory)


export default router