import express from "express";
import * as productController from "./../controllers/product-controller.js"
import {basicAuth} from "../middleware/auth.js";

const Router = express.Router()

// Routes to create a new product
Router.route("/")
    .post(basicAuth, productController.create)  //Passing the function and not invoking the function

//routes for specific product
Router.route("/:id")
    .get(productController.get)
    .put(basicAuth, productController.put)
    .patch(basicAuth, productController.patch)
    .delete(basicAuth, productController.remove)


export default Router;
