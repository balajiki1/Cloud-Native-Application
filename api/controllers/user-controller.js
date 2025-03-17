
import {setResponse} from "./index.js";
import bcrypt from "bcrypt";
import db from "../models/index.js";
import {logger} from "../config/logConfig.js";
import {client} from "../config/cloudWatch.js";
const User = db.users


//express app invokes the function to create new user
export const create = async (req, res) => {
    let hasError = false
    try{
        client.increment("Create_User")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)
        logger.info(`Checking if all mandatory fields are present`)

        const user = req.body
        let error=""
        if(!user.first_name || !user.last_name || !user.username || !user.password){
            error = "Username, Firstname, Lastname and Password are mandatory fields"
            // logger.warn("Mandatory fields not entered.")
            return setResponse({message: error}, 400, res, "warn")
        }
            
        //Check if User with the same email already exists
        logger.info(`Checking if user with ${user.username} exists`)
        const existingUser = await User.findOne({
            where: {
                username: req.body.username,
            },
        }).catch((error)=>  {
            hasError = true
            return setResponse(error, 400, res, "error")})

        if(existingUser){
            // logger.warn("User already Exists")
            return setResponse({message: "Username already exists"}, 400, res, "warn")
        }

        const validEmail = String(user.username)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            )
        if(!validEmail){
            // logger.warn(`Username should be a valid Email ID`)
            return setResponse({message: "Username should be an Email ID"}, 400, res, "warn")
        }

        const salt = await bcrypt.genSalt()
        user.password = await bcrypt.hash(user.password, salt)

        //Ignore this condition
        // if(user.account_created || user.account_updated || user.id)
        //     return setResponse({message: "ID, Account created and updated are read only fields"}, 400, res)

        logger.info(`All checks passed. Creating user now`)
        await User.create(user)
            .then((createdUser)=>{
                const responseObj = {
                    id: createdUser.id,
                    first_name: createdUser.first_name,
                    last_name: createdUser.last_name,
                    username: createdUser.username,
                    account_created: createdUser.account_created,
                    account_updated: createdUser.account_updated
                }
                logger.info(`User creation successful`)
                return setResponse(responseObj, 201, res)})
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

    } catch (error) {
        // logger.error(`Something went wrong. \n ${error}`)
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }

}

// export const login = async (req, res) => {
//     try{
//         const user = req.body
//         let existingPassword = ""
//         let validPassword = false
//         client.query(`Select password from users where username='${req.body.username}'`, async (err, result)=>{
//             try{
//                 if(result.rows.length===0){
//                     console.log("No such user")
//                     return setResponse({message: "Please check username"}, 400, res)
//                 }
//
//                 existingPassword = result.rows[0].password
//                 console.log("Existing Pwd: "+ existingPassword)
//                 console.log("Body Pwd: "+ user.password)
//                 validPassword = await bcrypt.compare(user.password, existingPassword);
//                 console.log(validPassword)
//                 if (!validPassword)
//                     return setResponse({message: "Password incorrect"}, 400, res)
//
//                 //Obtain Base64 encoding
//                 const concatString = user.username+":"+req.body.password;
//                 console.log("concatString in login"+concatString)
//                 const base64String = genBase64(concatString)
//                 console.log("Base 64 on login of user: "+base64String)
//
//                 return setResponse({base64: base64String}, 200, res)
//
//             }catch (error) {
//                 return setResponse(error, 400, res)
//             }
//         });
//
//         client.end;
//     } catch (error) {
//         return setResponse(error, 400, res)
//     }
// }

export const get = async (req, res) => {   //Search by id - auth required
    let hasError = false
    try{
        client.increment("Get_User_Details")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)

        //convert ID of currUser obtained from Middleware to a string because req.params.id is of type String
        if(req.currUser.id.toString()!==req.params.id){
            return setResponse({message: "You don't have access to this User account"}, 403, res, "warn")
        }

        logger.info(`Checking if user exists`)
        const foundUser = await User.findOne({
                where: { id: req.params.id }
            })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundUser){
            // logger.warn(`User does not exist`)
            return setResponse({message: "No such user. Please check id"}, 400, res, "warn")
        }

        const responseObj = {
            id: foundUser.id,
            first_name: foundUser.first_name,
            last_name: foundUser.last_name,
            username: foundUser.username,
            account_created: foundUser.account_created,
            account_updated: foundUser.account_updated
        }
        logger.info(`User found. Returning object`)
        return setResponse(responseObj, 200, res)

    } catch (error){
        // logger.error(`Something went wrong. \n ${error}`)
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}

//Update user info - auth required
export const update = async (req, res) => {
    let hasError = false
    try{
        client.increment("Update_User")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)

        const user = req.body

        logger.info(`Checking mandatory fields`)
        if(!user.first_name && !user.password && !user.last_name){
            // logger.warn(`Body missing`)
            return setResponse({message: "Provide body to update"}, 400, res, "warn")
        }

        logger.info(`Checking if user exists`)
        const foundUser = await User.findOne({
            where: { id: req.params.id }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundUser){
            // logger.warn(`User does not exist`)
            return setResponse({message: "No such user. Please check id"}, 400, res, "warn")
        }

        logger.info(`Checking if user is authorized`)
        if(req.currUser.id.toString()!==req.params.id) {
            // logger.warn(`You don't have access to this User account`)
            return setResponse({message: "You don't have access to this User account"}, 403, res, "warn")
        }

        logger.info(`Body validation`)
        if(user.username) {
            // logger.warn(`Username provided in the body. Not valid`)
            return setResponse({message: "Username cannot be updated"}, 400, res, "warn")
        }

        if(user.account_created || user.account_updated || user.id) {
            // logger.warn(`Invalid body provided for updation`)
            return setResponse({message: "ID, Account created and updated are read only fields"}, 400, res, "warn")
        }

        const salt = await bcrypt.genSalt()
        user.password = await bcrypt.hash(user.password, salt)

        await User.update(user, {
                where: { id: req.currUser.id },
                returning: true
            })
            .then(async ()=>{
                const updatedUser = await User.findOne({
                    where: { id: req.params.id }
                }).catch((error)=>  {
                    hasError = true
                    return setResponse(error, 400, res, "error")})

                const responseObj = {
                    id: updatedUser.id,
                    first_name: updatedUser.first_name,
                    last_name: updatedUser.last_name,
                    username: updatedUser.username,
                    account_created: updatedUser.account_created,
                    account_updated: updatedUser.account_updated
                }
                logger.info(`User successfully updated`)
                return setResponse(responseObj, 204, res)
            })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

    } catch(error) {
        // logger.error(`Something went wrong. \n ${error}`)
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}

// const genBase64 = (concatString) => {
//     const bufferObj = Buffer.from(concatString, "utf8");
//
//     // Encode the Buffer as a base64 string
//     const base64String = bufferObj.toString("base64");
//     return base64String
// }