import express from "express";
import * as imageController from "./../controllers/image-controller.js"
import {basicAuth} from "../middleware/auth.js";
import {upload, uploadFile} from "../middleware/multer.js";

const Router = express.Router()

// Routes to create a new image
Router.route("/:pid/image")
    .get(basicAuth, imageController.getAll)
    .post(basicAuth, uploadFile, imageController.create)  //Passing the function and not invoking the function

//routes for specific image
Router.route("/:pid/image/:id")
    .get(basicAuth, imageController.get)
    .delete(basicAuth, imageController.remove)


export default Router;
