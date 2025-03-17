import aws from "aws-sdk"
import dotenv from "dotenv"
dotenv.config()

//Access key of dev profile

export const s3 = new aws.S3({
    credentials: (process.env.USE_PROFILE) ? new aws.SharedIniFileCredentials({ profile: "dev" }) : null
});