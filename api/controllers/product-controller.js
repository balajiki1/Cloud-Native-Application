//search a particular to-do object
import {setResponse} from "./index.js";

import db from "../models/index.js";
import {logger} from "../config/logConfig.js";
import {client} from "../config/cloudWatch.js";
import {s3} from "../config/s3Config.js";
const Product = db.products
const Image = db.images

//express app invokes the function to create new product
export const create = async (req, res) => {
    let hasError = false
    try{
        client.increment("Create_Product")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)

        const product = req.body

        logger.info(`Checking if all mandatory fields are present`)
        if(!product.name || !product.description || !product.sku || !product.manufacturer || !product.quantity)
            return setResponse({message: "Name, Description, SKU, Manufacturer and Quantity are mandatory fields"}, 400, res, "warn")

        logger.info(`Checking if Product with the same SKU already exists`)
        //Check if Product with the same SKU already exists
        const existingProduct = await Product.findOne({
            where: {
                sku: req.body.sku,
            },
        }).catch((error)=>  {
            hasError = true
            return setResponse(error, 400, res, "error")})

        if(existingProduct)
            return setResponse({message: "Product with same SKU already exists"}, 400, res, "warn")

        logger.info(`Body Validation`)
        if(product.date_added || product.date_last_updated || product.id || product.owner_user_id)
            return setResponse({message: "ID, Owner User Id, Date added and updated are read only fields"}, 400, res, "warn")

        //Check if Quantity is valid
        logger.info(`Checking if Quantity is valid`)
        const {message, status} = checkQuantity(product.quantity)
        if(!status)
            return setResponse({message}, 400, res, "warn")
        
        //Check if Manufacturer is a string
        logger.info(`Checking if Manufacturer is a string`)
        if(typeof product.manufacturer!=="string")
            return setResponse({message: "Manufacturer should be a string"}, 400, res, "warn")

        product.owner_user_id = req.currUser.id

        await Product.create(product)
            .then((createdProduct)=>{
                logger.info(`Product created`)
                return setResponse(createdProduct, 201, res)})
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

    } catch (error) {
        // logger.error(`Something went wrong. \n ${error}`)
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }

}

export const get = async (req, res) => {   //Search by id - auth required
    let hasError = false
    try{
        client.increment("Get_Product_Details")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)

        logger.info(`Checking if Product exists`)
        const foundProduct = await Product.findOne({
            where: { id: req.params.id }
        })
            .catch((error)=>  {
                hasError = true
                // logger.error(`Something went wrong. \n ${error}`)
                return setResponse(error, 400, res, "error")
            })

        if(!foundProduct)
            return setResponse({message: "No such Product. Please check id"}, 404, res, "warn")

        logger.info(`Product found`)
        return setResponse(foundProduct, 200, res)

    } catch (error){
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}

export const put = async (req, res) => {
    let hasError = false
    try{
        client.increment("Update_Product_All_Details")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)
        const product = req.body

        logger.info(`Checking if mandatory fields are present`)
        if(!product.name || !product.description || !product.sku || !product.manufacturer || !product.quantity)
            return setResponse({message: "Name, Description, SKU, Manufacturer and Quantity are mandatory fields"}, 400, res, "warn")

        logger.info(`Checking if Product exists`)
        const foundProduct = await Product.findOne({
            where: { id: req.params.id }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundProduct)
            return setResponse({message: "No such Product. Please check id"}, 404, res, "warn")

        logger.info(`Checking if User is authorized`)
        if(foundProduct.owner_user_id!==req.currUser.id)
            return setResponse({message: "You don't have access to this Product"}, 403, res, "warn")

        logger.info(`Body Validation`)
        if(product.date_added || product.date_last_updated || product.id || product.owner_user_id)
            return setResponse({message: "ID, Owner User Id, Date added and updated are read only fields"}, 400, res, "warn")


        const existingProduct = await Product.findOne({
            where: {
                sku: req.body.sku,
            },
        }).catch((error)=>  {
            hasError = true
            return setResponse(error, 400, res, "error")})

        logger.info(`Checking if Product with the same SKU already exists`)
        if(existingProduct && foundProduct.sku!==req.body.sku)
            return setResponse({message: "Product with same SKU already exists"}, 400, res, "warn")

        //Check if quantity is valid
        logger.info(`Checking if Quantity is valid`)
        const {message, status} = checkQuantity(product.quantity)
        if(!status)
            return setResponse({message}, 400, res, "warn")

        //Check if Manufacturer is a string
        logger.info(`Checking if Manufacturer is a string`)
        if(typeof product.manufacturer!=="string")
            return setResponse({message: "Manufacturer should be a string"}, 400, res, "warn")

        product.owner_user_id = req.currUser.id;

        await Product.update(product, {
            where: { id: req.params.id },
            returning: true
        })
            .then(async ()=>{
                const updatedProduct = await Product.findOne({
                    where: { id: req.params.id }
                }).catch((error)=>  {
                    hasError = true
                    return setResponse(error, 400, res, "error")})

                const responseObj = {
                        id: updatedProduct.id,
                        name: updatedProduct.name,
                        description: updatedProduct.description,
                        sku: updatedProduct.sku,
                        manufacturer: updatedProduct.manufacturer,
                        quantity: updatedProduct.quantity,
                        date_added: updatedProduct.date_added,
                        date_last_updated: updatedProduct.date_last_updated,
                        owner_user_id: updatedProduct.owner_user_id
                    }
                logger.info(`Product updated successfully`)
                return setResponse(responseObj, 204, res)
            })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})


    } catch(error) {
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}

export const patch = async (req, res) => {
    let hasError = false
    try{
        client.increment("Update_Product_Some_Details")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)

        logger.info(`Checking if Product exists`)
        const foundProduct = await Product.findOne({
            where: { id: req.params.id }
        })
            .catch((error)=> {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundProduct)
            return setResponse({message: "No such Product. Please check id"}, 404, res, "warn")

        logger.info(`Checking if User is authorized`)
        if(foundProduct.owner_user_id!==req.currUser.id)
            return setResponse({message: "You don't have access to this Product"}, 403, res, "warn")

        const product = req.body

        logger.info(`Checking if Product with the same SKU already exists`)
        if(product.sku){
            const existingProduct = await Product.findOne({
                where: {
                    sku: req.body.sku,
                },
            }).catch((error)=>  setResponse(error, 400, res, "error"))

            if(existingProduct && foundProduct.sku!==req.body.sku)
                return setResponse({message: "Product with same SKU already exists"}, 400, res, "warn")
        }

        logger.info(`Body Validation`)
        if(product.date_added || product.date_last_updated || product.id || product.owner_user_id)
            return setResponse({message: "ID, Owner User Id, Date added and updated are read only fields"}, 400, res, "warn")

        if(product.quantity){
            //Check if quantity is valid
            logger.info(`Checking if Quantity is valid`)
            const {message, status} = checkQuantity(product.quantity)
            if(!status)
                return setResponse({message}, 400, res, "warn")
        }

        logger.info(`Checking if Manufacturer is a string`)
        if(product.manufacturer){
            if(typeof product.manufacturer!=="string")
                return setResponse({message: "Manufacturer should be a string"}, 400, res, "warn")
        }

        await Product.update(product, {
            where: { id: req.params.id },
            returning: true
        })
            .then(async ()=>{
                const updatedProduct = await Product.findOne({
                    where: { id: req.params.id }
                }).catch((error)=>  setResponse(error, 400, res, "error"))

                logger.info(`Product is successfully updated`)
                return setResponse(updatedProduct, 204, res)
            })
            .catch((error)=> setResponse(error, 400, res, "error"))

    } catch(error) {
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}

export const remove = async (req, res) => {
    let hasError = false
    try{
        client.increment("Delete_Product")
        const { protocol, method, hostname, originalUrl } = req
        logger.info(`Hitting Endpoint -  ${method} ${protocol}://${hostname}${originalUrl}`)
        logger.info(`Checking if Product exists`)

        const foundProduct = await Product.findOne({
            where: { id: req.params.id }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        if(!foundProduct)
            return setResponse({message: "No such Product. Please check id"}, 404, res, "warn")

        logger.info(`Checking if User is authorized`)
        if(foundProduct.owner_user_id!==req.currUser.id)
            return setResponse({message: "You don't have access to this Product"}, 403, res, "warn")

        const foundImages = await Image.findAll({
            where: { product_id: req.params.id }
        })
            .catch((error)=>  {
                hasError = true
                return setResponse(error, 400, res, "error")})

        console.log("HERE "+foundImages)
        for (const image of foundImages){
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: image.s3_bucket_path,
            };
            await s3.deleteObject(params).promise()
                .then(async ()=> {
                    console.log("Image deleted from s3 bucket")
                    await image.destroy()
                        .then(()=>
                        {
                            logger.info(`Image successfully deleted`)
                            })
                        .catch((error)=>  {
                            hasError = true
                            return setResponse(error, 400, res, "error")})
                })
                .catch((error)=>  {
                    hasError = true
                    return setResponse(error, 400, res, "error")})
        }

        await foundProduct.destroy()
            .then(()=>{
                logger.info(`Product successfully deleted`)
                return setResponse({message: "Product successfully deleted"}, 204, res)})
            .catch((error)=>  setResponse(error, 400, res, "error"))

    }catch(error) {
        if(!hasError)
            return setResponse(error, 400, res, "error")
    }
}


const checkQuantity = (quantity)=>{
    if (typeof quantity !== 'number')
        return {message: "Product quantity should be a number and not a string", status: false}

    if(quantity<0)
        return {message: "Product quantity cannot be less than 0", status: false}

    if(quantity>100)
        return {message: "Product quantity cannot be more than 100", status: false}

    // let parsedQuantity
    // try {
    //     parsedQuantity = JSON.parse(product.quantity);
    // } catch (err) {
    //     console.log(err)
    // }

    const validQuantity = String(quantity).match(/^\d+$/)
    if(!validQuantity)
        return {message: "Product quantity should be an integer", status: false}

    return {message: "Valid Quantity", status: true}
}
