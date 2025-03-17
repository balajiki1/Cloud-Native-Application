//search a particular to-do object
import {setResponse} from "./index.js";
import * as fs from "fs";

import db from "../models/index.js";
const Product = db.products
const Image = db.images
import {upload, uploadFile} from "../middleware/multer.js";
import multer from "multer";
import {s3} from "../config/s3Config.js";
import {logger} from "../config/logConfig.js";
import {client} from "../config/cloudWatch.js";
import { PublishCommand } from "@aws-sdk/client-sns";
import {snsClient} from "../config/snsConfig.js";

//express app invokes the function to create new image
export const create = async (req, res) => {
    let hasError = false
    try{
        client.increment("Create_Image")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)
        logger.info(`Checking if Mandatory fields are present`)

        if(req.body.image_id || req.body.product_id || req.body.file_name || req.body.date_created || req.body.s3_bucket_path){
            return setResponse({message: "Image Id, Product Id, File name, Date Created and Bucket path are Read Only Fields"}, 400, res, "warn")
        }
        //Product exists
        logger.info(`Checking if Product exists`)
        const foundProduct = await Product.findOne({
            where: { id: req.params.pid }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundProduct)
            return setResponse({message: "No such Product. Please check id"}, 404, res, "warn")

        //User autheticated
        logger.info(`Checking if User is authorized`)
        if(foundProduct.owner_user_id!==req.currUser.id)
            return setResponse({message: "You don't have access to this Product"}, 403, res, "warn")

        //File is got or not
        logger.info(`Checking if File is present`)
        if(!req.file)
            return setResponse({message: "Please Input a file"}, 400, res, "warn")

        const file = req.file
        // console.log(file)

        //Convert to stream to pass to S3
        const fileStream = fs.createReadStream(file.path)

        // Create a new image record in the database
        let createdImageId=0
        await Image.create({
            product_id: req.params.pid,
            file_name: req.file.originalname,
        })
            .then((createdImage)=>{
                createdImageId = createdImage.image_id
            })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        // Upload the image to S3
        let og_file_name = (req.file.originalname).replace(/\s/g, '')
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${req.params.pid}/${createdImageId}/${og_file_name}`,
            Body: fileStream,
            ContentType: req.file.mimetype
        };
        const uploaded = await s3.upload(params).promise()
            .catch(async (error)=>  {
            hasError = true
            await send_to_SNS_topic(params.Key, req.file.originalname, error, false, req.currUser.username)
            logger.info(`Message published to SNS`)
            return setResponse(error, 400, res, "error")});

        let latestImage
        //Put s3_bucket_path in the Image db
        await Image.update({s3_bucket_path: uploaded.Key}, {
            where: { image_id: createdImageId },
            returning: true
        })
            .then(async ()=>{
                const updatedImage = await Image.findOne({
                    where: { image_id: createdImageId }
                }).catch((error)=>  {
                    hasError = true
                    return setResponse(error, 400, res, "error")})
                // console.log(updatedImage)
                logger.info(`Image successfully uploaded`)
                latestImage=updatedImage
                return setResponse(updatedImage, 201, res)
            })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        await send_to_SNS_topic(latestImage.s3_bucket_path, latestImage.file_name, "Image Created", true, req.currUser.username)
        logger.info(`Message published to SNS`)
    } catch (error) {
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}

export const getAll = async (req, res) => {
    let hasError = false
    try{
        client.increment("Get_All_Images")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)
        //Product exists
        const foundProduct = await Product.findOne({
            where: { id: req.params.pid }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundProduct)
            return setResponse({message: "No such Product. Please check id"}, 404, res, "warn")

        //User autheticated
        if(foundProduct.owner_user_id!==req.currUser.id)
            return setResponse({message: "You don't have access to this Product"}, 403, res, "warn")

        const foundImages = await Image.findAll({
            where: { product_id: req.params.pid }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        const list = []
        logger.info(`Images found`)
        foundImages.forEach(image => {
            list.push(image.dataValues)
        })

        return setResponse(list, 200, res)
    }catch (error){
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}

export const get = async (req, res) => {
    let hasError = false
    try{
        client.increment("Get_One_Image_Details")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)
        //Product exists
        const foundProduct = await Product.findOne({
            where: { id: req.params.pid }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundProduct)
            return setResponse({message: "No such Product. Please check id"}, 404, res, "warn")

        //User authenticated
        if(foundProduct.owner_user_id!==req.currUser.id)
            return setResponse({message: "You don't have access to this Product"}, 403, res, "warn")

        //Image exists
        const foundImage = await Image.findOne({
            where: { image_id: req.params.id }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundImage)
            return setResponse({message: "No such Image. Please check id"}, 404, res, "warn")

        if(foundImage.product_id!==foundProduct.id)
            return setResponse({message: "Image not associated with the product"}, 404, res, "warn")

        logger.info(`Image found`)
        return setResponse(foundImage, 200, res)

    } catch (error){
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}

export const remove = async (req, res) => {
    let hasError = false
    try{
        client.increment("Delete_Image")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)
        //Product exists
        const foundProduct = await Product.findOne({
            where: { id: req.params.pid }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundProduct)
            return setResponse({message: "No such Product. Please check id"}, 404, res, "warn")

        //User authenticated
        if(foundProduct.owner_user_id!==req.currUser.id)
            return setResponse({message: "You don't have access to this Product"}, 403, res, "warn")

        //Image exists
        const foundImage = await Image.findOne({
            where: { image_id: req.params.id }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        const image_path=foundImage.s3_bucket_path
        const image_name=foundImage.file_name
        if(!foundImage)
            return setResponse({message: "No such Image. Please check id"}, 404, res, "warn")

        if(foundImage.product_id!==foundProduct.id)
            return setResponse({message: "Image not associated with the product"}, 404, res, "warn")

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: foundImage.s3_bucket_path,
        };
        await s3.deleteObject(params).promise()
            .then(async ()=> {
                console.log("Image deleted from s3 bucket")
                await foundImage.destroy()
                    .then(()=>
                    {
                        logger.info(`Image successfully deleted`)
                        return setResponse({message: "Image successfully deleted"}, 204, res)})
                    .catch((error)=>  {
                        hasError = true
                        return setResponse(error, 400, res, "error")})
            })
            .catch(async (error)=>  {
                hasError = true
                await send_to_SNS_topic(image_path, image_name, error, false, req.currUser.username)
                logger.info(`Message published to SNS`)
                return setResponse(error, 400, res, "error")})

        await send_to_SNS_topic(image_path, image_name, "Image Deleted", true, req.currUser.username)
        logger.info(`Message published to SNS`)
    }catch(error) {
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}

const send_to_SNS_topic = async(image_path, image_name, msg, status, user_email) => {
    const message = {
        "image_path": image_path,
        "image_name": image_name,
        "message": msg,
        "status": status,
        "user_email": user_email
    }

    const input = { // PublishInput
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: JSON.stringify(message),
        Subject: "Image Operation",
    };
    const command = new PublishCommand(input);
    await snsClient.send(command);
}
