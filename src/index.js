import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'
dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        try {
            app.listen(process.env.PORT || 8000, () => {
                console.log(`Server is running at port ${process.env.PORT}`);
            })
        }
        catch (e) {
            console.log(e)
            throw e
        }
    })
    .catch((error) => {
        console.log('mongoDB connection fail !!!', error)
        throw error
    })












/*
;(async ()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI} / ${DB_NAME}`);
       app.on('error',(error)=>{
        console.log("Error: " , error)
        throw error
       })
        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    }
    catch(e){
        console.log(e)
        throw e
    }
})()
*/