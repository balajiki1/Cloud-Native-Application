import {dbEnvConfig} from "../config/config.js";
import {Sequelize} from "sequelize";
import {userModel} from "./User.js";
import dotenv from "dotenv"
import {productModel} from "./Product.js";
import { imageModel } from "./Image.js";
dotenv.config()

const env = process.env.NODE_ENV || 'development';
const dbConfig = dbEnvConfig[env]

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,

    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = userModel(sequelize, Sequelize)
db.products = productModel(sequelize, Sequelize)
db.images = imageModel(sequelize, Sequelize)

//Association of user and product
// db.users.hasMany(db.products)
// db.products.belongsTo(db.users, {
//     foreignKey: "owner_user_id"
// })

export default db