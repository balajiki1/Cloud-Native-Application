import UserRouter from "./user-routes.js";
import HealthRouter from "./health.js"
import ProductRouter from "./product-routes.js";
import ImageRouter from "./image-routes.js"
import {setResponse} from "../controllers/index.js";


export default (app) => {
    app.use("/v1/user", UserRouter)
    app.use("/v1/product", ProductRouter)
    app.use("/v1/product/", ImageRouter)
    app.use("/healthz", HealthRouter)
    app.use("*", (req, res)=> setResponse({message: "Invalid Route"}, 404, res))
}
